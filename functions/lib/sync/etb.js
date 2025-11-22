"use strict";
// functions/src/etb.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.etbCatalog = exports.syncEtbOnly = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
const tmdb_1 = require("./tmdb");
// Config ETB como proveedor TMDB (de momento)
const PLATAFORMA_ETB = { id: 309, frecuenciaDias: 1 };
// HTTP: sincronizar SOLO ETB (misma lógica que antes, pero separada)
exports.syncEtbOnly = (0, https_1.onRequest)(async (req, res) => {
    try {
        console.log("Lanzando sync SOLO ETB desde syncEtbOnly...");
        await (0, tmdb_1.procesarProveedor)("etb", PLATAFORMA_ETB);
        res.status(200).json({
            ok: true,
            message: "Catálogo ETB sincronizado correctamente."
        });
    }
    catch (error) {
        console.error("Error en syncEtbOnly:", error);
        res.status(500).json({
            ok: false,
            message: "Error al sincronizar catálogo ETB.",
            error: error.message
        });
    }
});
// HTTP: API ETB → devuelve catálogo ETB en JSON
exports.etbCatalog = (0, https_1.onRequest)(async (req, res) => {
    try {
        const snapshot = await firebase_1.db
            .collection("catalogo")
            .where("etb", "==", true)
            .limit(5000)
            .get();
        const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json({
            ok: true,
            count: items.length,
            items
        });
    }
    catch (error) {
        console.error("Error en etbCatalog:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener catálogo ETB.",
            error: error.message
        });
    }
});
