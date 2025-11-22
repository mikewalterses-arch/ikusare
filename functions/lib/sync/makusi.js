"use strict";
// functions/src/makusi.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMakusi = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
const cheerio = __importStar(require("cheerio"));
async function syncMakusiCatalog() {
    console.log("IKUSARE: sincronización Makusi…");
    const pages = [
        "https://makusi.eus/ikusi/c/film-berriak-makusi",
        "https://makusi.eus/ikusi/filmak-makusi-8"
    ];
    let count = 0;
    for (const url of pages) {
        console.log(`   Leyendo página Makusi: ${url}`);
        const html = await fetch(url).then((r) => r.text());
        const $ = cheerio.load(html);
        const ops = [];
        // OJO: habrá que ajustar los selectores exactos mirando el HTML real
        $(".portfolio-item").each((_, el) => {
            const title = $(el).find(".head_title").text().trim();
            const link = $(el).find("a").attr("href");
            const poster = $(el).find("img").attr("src");
            if (!title || !link)
                return;
            const id = "makusi_" +
                title
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "_")
                    .replace(/^_+|_+$/g, "");
            const fullPoster = poster && !poster.startsWith("http")
                ? `https://makusi.eus${poster}`
                : poster || null;
            const docRef = firebase_1.db.collection("catalogo").doc(id);
            const p = docRef.set({
                titulo: title,
                fuente: "makusi",
                makusi_url: `https://makusi.eus${link}`,
                poster: fullPoster,
                en_makusi: true,
                ultima_actualizacion_makusi: new Date().toISOString()
            }, { merge: true });
            ops.push(p);
            count++;
        });
        await Promise.all(ops);
    }
    console.log(`✅ Makusi: ${count} elementos procesados/actualizados`);
    return count;
}
exports.syncMakusi = (0, https_1.onRequest)({
    timeoutSeconds: 300,
    cors: true
}, async (req, res) => {
    try {
        console.log("Lanzando syncMakusi...");
        const imported = await syncMakusiCatalog();
        res.status(200).json({
            ok: true,
            message: "Catálogo Makusi sincronizado correctamente.",
            imported
        });
    }
    catch (error) {
        console.error("Error en syncMakusi:", error);
        res.status(500).json({
            ok: false,
            message: "Error al sincronizar catálogo Makusi.",
            error: error.message
        });
    }
});
