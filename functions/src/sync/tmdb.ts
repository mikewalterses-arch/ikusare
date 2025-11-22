// functions/src/tmdb.ts

import { defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { db } from "../firebase";

// TMDB_KEY viene de params (functions/.env.local o configuración de Firebase)
const TMDB_KEY = defineString("TMDB_KEY");

// Proveedores TMDB (SIN ETB, ETB va aparte en etb.ts)
const PLATAFORMAS: Record<string, { id: number; frecuenciaDias: number }> = {
  netflix: { id: 8, frecuenciaDias: 3 },
  max: { id: 384, frecuenciaDias: 3 },
  disney: { id: 337, frecuenciaDias: 3 },
  prime: { id: 119, frecuenciaDias: 3 },
  movistar: { id: 149, frecuenciaDias: 3 },
  filmin: { id: 63, frecuenciaDias: 3 },

  apple: { id: 350, frecuenciaDias: 3 }, // Apple TV+
  rakuten: { id: 333, frecuenciaDias: 5 },
  viaplay: { id: 371, frecuenciaDias: 5 },
  mitele: { id: 527, frecuenciaDias: 5 },
  rtve: { id: 447, frecuenciaDias: 5 },
  cine: { id: 241, frecuenciaDias: 7 }
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSafeJson(url: string, maxRetries = 5): Promise<any | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      console.log(`Error ${res.status} en ${url}`);
    } catch (e: any) {
      console.log(`Error en fetch (${i + 1}/${maxRetries}):`, e.message);
    }
    await sleep(1000 * (i + 1));
  }
  return null;
}

// Idiomas disponibles para un título
async function fetchAvailableLanguages(
  tmdbId: number,
  tipo: "pelicula" | "serie"
) {
  const idiomas: Record<string, { titulo: string; sinopsis: string }> = {};
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

function getTodayISODate() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(fromISO: string, toISO: string) {
  if (!fromISO || !toISO) return Infinity;
  const d1 = new Date(fromISO);
  const d2 = new Date(toISO);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function shouldRunProvider(
  nombre: string,
  metaDocData: any,
  frecuenciaDias: number
) {
  const hoy = getTodayISODate();
  const metaPlataformas = metaDocData?.plataformas || {};
  const lastRun = metaPlataformas[nombre]?.lastRun;

  if (!lastRun) return true;
  const diff = daysBetween(lastRun, hoy);
  return diff >= frecuenciaDias;
}

async function saveProviderLastRun(nombre: string, metaDocRef: any) {
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

// Función genérica de proveedor TMDB (NO incluye ETB)
export async function procesarProveedor(
  nombre: string,
  conf: { id: number; frecuenciaDias: number }
) {
  const { id } = conf;
  console.log(`\n>>> Procesando proveedor: ${nombre.toUpperCase()} (ID: ${id})`);

  const MAX_PAGES = 3;
  const allItems: any[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const pelisUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY.value()}&watch_region=ES&with_watch_providers=${id}&language=es-ES&page=${page}`;
    const seriesUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY.value()}&watch_region=ES&with_watch_providers=${id}&language=es-ES&page=${page}`;

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

    allItems.push(...pelis.map((p: any) => ({ ...p, tipo: "pelicula" })));
    allItems.push(...series.map((s: any) => ({ ...s, tipo: "serie" })));

    console.log(`   Página ${page}: +${pelis.length + series.length} títulos`);
    await sleep(500);
  }

  console.log(`   Total items brutos ${nombre}: ${allItems.length}`);

  let count = 0;

  for (const item of allItems) {
    try {
      const tipo = item.tipo as "pelicula" | "serie";
      const idiomas = await fetchAvailableLanguages(item.id, tipo);
      const idiomasDisponibles = Object.keys(idiomas);

      const añoRaw = item.release_date || item.first_air_date || "";
      const año = añoRaw ? Number(añoRaw.split("-")[0]) : null;

      const docRef = db.collection("catalogo").doc(item.id.toString());
      const docSnap = await docRef.get();
      const existing = docSnap.exists ? docSnap.data() || {} : {};

      const plataformaFlags = {
        netflix: nombre === "netflix",
        max: nombre === "max",
        disney: nombre === "disney",
        prime: nombre === "prime",
        movistar: nombre === "movistar",
        filmin: nombre === "filmin",
        etb: false, // ETB se gestiona en etb.ts
        apple: nombre === "apple",
        rakuten: nombre === "rakuten",
        viaplay: nombre === "viaplay",
        mitele: nombre === "mitele",
        rtve: nombre === "rtve",
        cine: nombre === "cine"
      };

      const original_eu = item.original_language === "eu";
      const en_etb = existing.en_etb || false;

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
        idiomas_disponibles: idiomasDisponibles,
        idiomas,
        original_eu,
        en_etb,
        ultima_actualizacion: ahoraISO
      };

      const payload = {
        ...baseData,
        netflix: (existing as any).netflix || plataformaFlags.netflix,
        max: (existing as any).max || plataformaFlags.max,
        disney: (existing as any).disney || plataformaFlags.disney,
        prime: (existing as any).prime || plataformaFlags.prime,
        movistar: (existing as any).movistar || plataformaFlags.movistar,
        filmin: (existing as any).filmin || plataformaFlags.filmin,
        etb: (existing as any).etb || plataformaFlags.etb,
        apple: (existing as any).apple || plataformaFlags.apple,
        rakuten: (existing as any).rakuten || plataformaFlags.rakuten,
        viaplay: (existing as any).viaplay || plataformaFlags.viaplay,
        mitele: (existing as any).mitele || plataformaFlags.mitele,
        rtve: (existing as any).rtve || plataformaFlags.rtve,
        cine: (existing as any).cine || plataformaFlags.cine,
        euskera_manual: (existing as any).euskera_manual || false
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
    } catch (e: any) {
      console.log(`\nError guardando ${item.id}:`, e.message);
    }
  }

  console.log(`   ✅ ${nombre}: ${count} títulos procesados`);
}

async function syncCatalogTmdb() {
  console.log("IKUSARE: sincronización diaria TMDB…");

  const metaDocRef = db.collection("metadata").doc("catalog_sync");
  const metaSnap = await metaDocRef.get();
  const metaData = metaSnap.exists ? metaSnap.data() : {};

  const hoy = getTodayISODate();
  console.log(`Fecha de referencia: ${hoy}`);

  for (const [nombre, conf] of Object.entries(PLATAFORMAS)) {
    const run = shouldRunProvider(nombre, metaData, conf.frecuenciaDias);

    if (!run) {
      console.log(
        `- ${nombre}: SALTADO (no han pasado ${conf.frecuenciaDias} días)`
      );
      continue;
    }

    console.log(
      `- ${nombre}: se va a actualizar (frecuencia ${conf.frecuenciaDias} días)`
    );
    await procesarProveedor(nombre, conf);
    await saveProviderLastRun(nombre, metaDocRef);
  }

  console.log("✅ Sincronización TMDB completada.");
}

// Scheduler diario SOLO TMDB
export const dailySync = onSchedule(
  { schedule: "every 24 hours", timeZone: "Europe/Madrid" },
  async () => {
    await syncCatalogTmdb();
  }
);

// Endpoint HTTP para lanzar sync TMDB desde admin
export const syncCatalogHttp = onRequest(
  {
    timeoutSeconds: 300,
    cors: true
  },
  async (req, res) => {
    try {
      console.log("Lanzando sync TMDB desde syncCatalogHttp...");
      await syncCatalogTmdb();
      res
        .status(200)
        .json({ ok: true, message: "Catálogo TMDB sincronizado correctamente." });
    } catch (error) {
      console.error("Error en syncCatalogHttp:", error);
      res
        .status(500)
        .json({ ok: false, message: "Error al sincronizar catálogo TMDB." });
    }
  }
);
