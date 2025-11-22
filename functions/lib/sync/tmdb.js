"use strict";
// functions/src/tmdb.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCatalogHttp = exports.dailySync = void 0;
exports.procesarProveedor = procesarProveedor;
const params_1 = require("firebase-functions/params");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
// TMDB_KEY viene de params (functions/.env.local o configuración de Firebase)
const TMDB_KEY = (0, params_1.defineString)("TMDB_KEY");
// Proveedores TMDB (SIN ETB, ETB va aparte en etb.ts)
const PLATAFORMAS = {
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
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function fetchSafeJson(url, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok)
                return await res.json();
            console.log(`Error ${res.status} en ${url}`);
        }
        catch (e) {
            console.log(`Error en fetch (${i + 1}/${maxRetries}):`, e.message);
        }
        await sleep(1000 * (i + 1));
    }
    return null;
}
// Idiomas disponibles para un título
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
function getTodayISODate() {
    return new Date().toISOString().split("T")[0];
}
function daysBetween(fromISO, toISO) {
    if (!fromISO || !toISO)
        return Infinity;
    const d1 = new Date(fromISO);
    const d2 = new Date(toISO);
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
function shouldRunProvider(nombre, metaDocData, frecuenciaDias) {
    const hoy = getTodayISODate();
    const metaPlataformas = metaDocData?.plataformas || {};
    const lastRun = metaPlataformas[nombre]?.lastRun;
    if (!lastRun)
        return true;
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
// Función genérica de proveedor TMDB (NO incluye ETB)
async function procesarProveedor(nombre, conf) {
    const { id } = conf;
    console.log(`\n>>> Procesando proveedor: ${nombre.toUpperCase()} (ID: ${id})`);
    const MAX_PAGES = 3;
    const allItems = [];
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
        allItems.push(...pelis.map((p) => ({ ...p, tipo: "pelicula" })));
        allItems.push(...series.map((s) => ({ ...s, tipo: "serie" })));
        console.log(`   Página ${page}: +${pelis.length + series.length} títulos`);
        await sleep(500);
    }
    console.log(`   Total items brutos ${nombre}: ${allItems.length}`);
    let count = 0;
    for (const item of allItems) {
        try {
            const tipo = item.tipo;
            const idiomas = await fetchAvailableLanguages(item.id, tipo);
            const idiomasDisponibles = Object.keys(idiomas);
            const añoRaw = item.release_date || item.first_air_date || "";
            const año = añoRaw ? Number(añoRaw.split("-")[0]) : null;
            const docRef = firebase_1.db.collection("catalogo").doc(item.id.toString());
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
                netflix: existing.netflix || plataformaFlags.netflix,
                max: existing.max || plataformaFlags.max,
                disney: existing.disney || plataformaFlags.disney,
                prime: existing.prime || plataformaFlags.prime,
                movistar: existing.movistar || plataformaFlags.movistar,
                filmin: existing.filmin || plataformaFlags.filmin,
                etb: existing.etb || plataformaFlags.etb,
                apple: existing.apple || plataformaFlags.apple,
                rakuten: existing.rakuten || plataformaFlags.rakuten,
                viaplay: existing.viaplay || plataformaFlags.viaplay,
                mitele: existing.mitele || plataformaFlags.mitele,
                rtve: existing.rtve || plataformaFlags.rtve,
                cine: existing.cine || plataformaFlags.cine,
                euskera_manual: existing.euskera_manual || false
            };
            if (docSnap.exists) {
                await docRef.update(payload);
            }
            else {
                await docRef.set(payload);
            }
            count++;
            if (count % 20 === 0) {
                process.stdout.write(`   ${count} títulos procesados...\r`);
            }
            await sleep(100);
        }
        catch (e) {
            console.log(`\nError guardando ${item.id}:`, e.message);
        }
    }
    console.log(`   ✅ ${nombre}: ${count} títulos procesados`);
}
async function syncCatalogTmdb() {
    console.log("IKUSARE: sincronización diaria TMDB…");
    const metaDocRef = firebase_1.db.collection("metadata").doc("catalog_sync");
    const metaSnap = await metaDocRef.get();
    const metaData = metaSnap.exists ? metaSnap.data() : {};
    const hoy = getTodayISODate();
    console.log(`Fecha de referencia: ${hoy}`);
    for (const [nombre, conf] of Object.entries(PLATAFORMAS)) {
        const run = shouldRunProvider(nombre, metaData, conf.frecuenciaDias);
        if (!run) {
            console.log(`- ${nombre}: SALTADO (no han pasado ${conf.frecuenciaDias} días)`);
            continue;
        }
        console.log(`- ${nombre}: se va a actualizar (frecuencia ${conf.frecuenciaDias} días)`);
        await procesarProveedor(nombre, conf);
        await saveProviderLastRun(nombre, metaDocRef);
    }
    console.log("✅ Sincronización TMDB completada.");
}
// Scheduler diario SOLO TMDB
exports.dailySync = (0, scheduler_1.onSchedule)({ schedule: "every 24 hours", timeZone: "Europe/Madrid" }, async () => {
    await syncCatalogTmdb();
});
// Endpoint HTTP para lanzar sync TMDB desde admin
exports.syncCatalogHttp = (0, https_1.onRequest)({
    timeoutSeconds: 300,
    cors: true
}, async (req, res) => {
    try {
        console.log("Lanzando sync TMDB desde syncCatalogHttp...");
        await syncCatalogTmdb();
        res
            .status(200)
            .json({ ok: true, message: "Catálogo TMDB sincronizado correctamente." });
    }
    catch (error) {
        console.error("Error en syncCatalogHttp:", error);
        res
            .status(500)
            .json({ ok: false, message: "Error al sincronizar catálogo TMDB." });
    }
});
