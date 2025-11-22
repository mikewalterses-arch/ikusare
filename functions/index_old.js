// functions/index.js

// Parámetros y triggers v2
const { defineString } = require("firebase-functions/params");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// TMDB_KEY viene de functions/.env -> TMDB_KEY=TU_CLAVE
const TMDB_KEY = defineString("TMDB_KEY");

// Config de plataformas con frecuencia en días
const PLATAFORMAS = {
  // actuales
  netflix: { id: 8,   frecuenciaDias: 3 },
  max:     { id: 384, frecuenciaDias: 3 },
  disney:  { id: 337, frecuenciaDias: 3 },
  prime:   { id: 119, frecuenciaDias: 3 },
  movistar:{ id: 149, frecuenciaDias: 3 },
  etb:     { id: 309, frecuenciaDias: 1 },  // ETB cada día
  filmin:  { id: 63,  frecuenciaDias: 3 },

  // nuevas
  apple:   { id: 350, frecuenciaDias: 3 },   // Apple TV+
  rakuten: { id: 333, frecuenciaDias: 5 },   // Rakuten TV
  viaplay: { id: 371, frecuenciaDias: 5 },   // Viaplay
  mitele:  { id: 527, frecuenciaDias: 5 },   // Mitele
  rtve:    { id: 447, frecuenciaDias: 5 },   // RTVE
  cine:    { id: 241, frecuenciaDias: 7 }    // Cine en casa (opcional)
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// En Node 18+ tenemos fetch global (no hace falta node-fetch)
async function fetchSafeJson(url, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      console.log(`Error ${res.status} en ${url}`);
    } catch (e) {
      console.log(`Error en fetch (${i + 1}/${maxRetries}):`, e.message);
    }
    await sleep(1000 * (i + 1)); // backoff progresivo
  }
  return null;
}

// Obtiene título + sinopsis en varios idiomas para un título concreto
async function fetchAvailableLanguages(tmdbId, tipo) {
  const idiomas = {};
  const endpoint = tipo === "pelicula" ? "movie" : "tv";
  const LANGS = ["eu", "es", "en", "ca"];

  for (const lang of LANGS) {
    const url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_KEY.value()}&language=${lang}`;
    const data = await fetchSafeJson(url);
    if (data) {
      const titulo = data.title || data.name || "";
      const sinopsis = data.overview || "";
      if (titulo || sinopsis) {
        idiomas[lang] = { titulo, sinopsis };
      }
    }
    await sleep(200);
  }
  return idiomas;
}

// Utilidades para control de frecuencia
function getTodayISODate() {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function daysBetween(fromISO, toISO) {
  if (!fromISO || !toISO) return Infinity;
  const d1 = new Date(fromISO);
  const d2 = new Date(toISO);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function shouldRunProvider(nombre, metaDocData, frecuenciaDias) {
  const hoy = getTodayISODate();
  const metaPlataformas = metaDocData?.plataformas || {};
  const lastRun = metaPlataformas[nombre]?.lastRun;

  if (!lastRun) return true; // nunca ejecutado → ejecutar
  const diff = daysBetween(lastRun, hoy);
  return diff >= frecuenciaDias;
}

async function saveProviderLastRun(nombre, metaDocRef) {
  const metaSnap = await metaDocRef.get();
  const hoy = getTodayISODate();

  if (!metaSnap.exists) {
    await metaDocRef.set({
      plataformas: {
        [nombre]: { lastRun: hoy }
      }
    });
    return;
  }

  const data = metaSnap.data();
  const plataformas = data.plataformas || {};
  plataformas[nombre] = { lastRun: hoy };

  await metaDocRef.update({ plataformas });
}

// Procesa una plataforma concreta (pelis + series)
async function procesarProveedor(nombre, conf) {
  const { id } = conf;
  console.log(`\n>>> Procesando proveedor: ${nombre.toUpperCase()} (ID: ${id})`);

  const MAX_PAGES = nombre === "etb" ? 5 : 3; // ETB más completo
  let allItems = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    let pelisUrl;
    let seriesUrl;

    if (nombre === "etb") {
      // ETB: TODO el catálogo, sin filtrar por idioma
      pelisUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY.value()}&watch_region=ES&with_watch_providers=${id}&page=${page}`;
      seriesUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY.value()}&watch_region=ES&with_watch_providers=${id}&page=${page}`;
    } else {
      // Resto: principal en español (para sinopsis en es-ES)
      pelisUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY.value()}&watch_region=ES&with_watch_providers=${id}&language=es-ES&page=${page}`;
      seriesUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY.value()}&watch_region=ES&with_watch_providers=${id}&language=es-ES&page=${page}`;
    }

    const [pelisData, seriesData] = await Promise.all([
      fetchSafeJson(pelisUrl),
      fetchSafeJson(seriesUrl)
    ]);

    const pelis = pelisData?.results || [];
    const series = seriesData?.results || [];

    if (pelis.length === 0 && series.length === 0) {
      console.log(`   Página ${page}: sin resultados, corto.`);
      break;
    }

    allItems.push(...pelis.map((p) => ({ ...p, tipo: "pelicula" })));
    allItems.push(...series.map((s) => ({ ...s, tipo: "serie" })));

    console.log(`   Página ${page}: +${pelis.length + series.length} títulos`);
    await sleep(500);
  }

  console.log(`   Total items brutos ${nombre}: ${allItems.length}`);

  let count = 0;

  for (const item of allItems) {
    try {
      const tipo = item.tipo; // "pelicula" | "serie"
      const idiomas = await fetchAvailableLanguages(item.id, tipo);
      const idiomasDisponibles = Object.keys(idiomas);

      const añoRaw = item.release_date || item.first_air_date || "";
      const año = añoRaw ? Number(añoRaw.split("-")[0]) : null;

      const docRef = db.collection("catalogo").doc(item.id.toString());
      const docSnap = await docRef.get();
      const existing = docSnap.exists ? docSnap.data() : {};

      // Flags de plataforma
      const plataformaFlags = {
        netflix: nombre === "netflix",
        max:     nombre === "max",
        disney:  nombre === "disney",
        prime:   nombre === "prime",
        movistar:nombre === "movistar",
        filmin:  nombre === "filmin",
        etb:     nombre === "etb",
        apple:   nombre === "apple",
        rakuten: nombre === "rakuten",
        viaplay: nombre === "viaplay",
        mitele:  nombre === "mitele",
        rtve:    nombre === "rtve",
        cine:    nombre === "cine"
      };

      const original_eu = item.original_language === "eu";
      const en_etb = nombre === "etb" || existing.en_etb || false;

      const ahoraISO = new Date().toISOString();

      const baseData = {
        tmdb_id: item.id,
        titulo: item.title || item.name || "Sin título",
        tipo: tipo,
        año: año || null,
        sinopsis: item.overview || "",
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        rating: item.vote_average
          ? Number(item.vote_average.toFixed(1))
          : null,
        idioma_original: item.original_language || null,
        // 🔧 AQUÍ ESTABA EL BUG: ahora usamos la variable correcta
        idiomas_disponibles: idiomasDisponibles,
        idiomas,
        original_eu,
        en_etb,
        ultima_actualizacion: ahoraISO
      };

      const payload = {
        ...baseData,
        // merge de plataformas con lo ya existente
        netflix: (existing.netflix || false) || plataformaFlags.netflix,
        max:     (existing.max || false) || plataformaFlags.max,
        disney:  (existing.disney || false) || plataformaFlags.disney,
        prime:   (existing.prime || false) || plataformaFlags.prime,
        movistar:(existing.movistar || false) || plataformaFlags.movistar,
        filmin:  (existing.filmin || false) || plataformaFlags.filmin,
        etb:     (existing.etb || false) || plataformaFlags.etb,
        apple:   (existing.apple || false) || plataformaFlags.apple,
        rakuten: (existing.rakuten || false) || plataformaFlags.rakuten,
        viaplay: (existing.viaplay || false) || plataformaFlags.viaplay,
        mitele:  (existing.mitele || false) || plataformaFlags.mitele,
        rtve:    (existing.rtve || false) || plataformaFlags.rtve,
        cine:    (existing.cine || false) || plataformaFlags.cine,

        // MUY IMPORTANTE: no tocar tu marca manual
        euskera_manual: existing.euskera_manual || false
      };

      if (docSnap.exists) {
        await docRef.update(payload);
      } else {
        await docRef.set(payload);
      }

      count++;
      if (count % 20 === 0) {
        process.stdout.write(`   ${count} títulos procesados...\r`);
      }
      await sleep(100);
    } catch (e) {
      console.log(`\nError guardando ${item.id}:`, e.message);
    }
  }

  console.log(`   ✅ ${nombre}: ${count} títulos procesados`);
}

// Función principal que decide qué plataformas ejecutar según la frecuencia
async function syncCatalog() {
  console.log("IKUSARE: sincronización diaria de catálogo…");

  const metaDocRef = db.collection("metadata").doc("catalog_sync");
  const metaSnap = await metaDocRef.get();
  const metaData = metaSnap.exists ? metaSnap.data() : {};

  const hoy = getTodayISODate();
  console.log(`Fecha de referencia: ${hoy}`);

  for (const [nombre, conf] of Object.entries(PLATAFORMAS)) {
    const { frecuenciaDias } = conf;
    const run = shouldRunProvider(nombre, metaData, frecuenciaDias);

    if (!run) {
      console.log(
        `- ${nombre}: SALTADO (no han pasado ${frecuenciaDias} días desde la última ejecución)`
      );
      continue;
    }

    console.log(`- ${nombre}: se va a actualizar (frecuencia ${frecuenciaDias} días)`);
    await procesarProveedor(nombre, conf);
    await saveProviderLastRun(nombre, metaDocRef);
  }

  console.log("✅ Sincronización completada.");
}

// 1) Scheduler diario (cada 24h)
exports.dailySync = onSchedule(
  { schedule: "every 24 hours", timeZone: "Europe/Madrid" },
  async () => {
    await syncCatalog();
  }
);

// 2) Endpoint HTTP para lanzar TODA la sync desde el panel admin
exports.syncCatalogHttp = onRequest(
  {
    timeoutSeconds: 300,     // ⬅️ hasta 5 minutos
    cors: true               // opcional, pero viene bien si llamas desde el front
  },
  async (req, res) => {
    try {
      console.log("Lanzando syncCatalog desde syncCatalogHttp...");
      await syncCatalog();
      res
        .status(200)
        .json({ ok: true, message: "Catálogo sincronizado correctamente." });
    } catch (error) {
      console.error("Error en syncCatalogHttp:", error);
      res
        .status(500)
        .json({ ok: false, message: "Error al sincronizar catálogo." });
    }
  }
);

// 3) Endpoint HTTP para sincronizar SOLO ETB
exports.syncEtbOnly = onRequest(async (req, res) => {
  try {
    console.log("Lanzando sync SOLO ETB desde syncEtbOnly...");
    await procesarProveedor("etb", PLATAFORMAS.etb);
    res
      .status(200)
      .json({ ok: true, message: "Catálogo ETB sincronizado correctamente." });
  } catch (error) {
    console.error("Error en syncEtbOnly:", error);
    res.status(500).json({
      ok: false,
      message: "Error al sincronizar catálogo ETB.",
    });
  }
});

// 4) API ETB: devuelve catálogo ETB en JSON
exports.etbCatalog = onRequest(async (req, res) => {
  try {
    const snapshot = await db
      .collection("catalogo")
      .where("etb", "==", true)
      .limit(5000)
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      ok: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Error en etbCatalog:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener catálogo ETB.",
    });
  }
});
