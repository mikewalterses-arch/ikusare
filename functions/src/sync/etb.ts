// functions/src/etb.ts

import { onRequest } from "firebase-functions/v2/https";
import { db } from "../firebase";
import { procesarProveedor } from "./tmdb";

// Config ETB como proveedor TMDB (de momento)
const PLATAFORMA_ETB = { id: 309, frecuenciaDias: 1 };

// HTTP: sincronizar SOLO ETB (misma lógica que antes, pero separada)
export const syncEtbOnly = onRequest(async (req, res) => {
  try {
    console.log("Lanzando sync SOLO ETB desde syncEtbOnly...");
    await procesarProveedor("etb", PLATAFORMA_ETB);
    res.status(200).json({
      ok: true,
      message: "Catálogo ETB sincronizado correctamente."
    });
  } catch (error: any) {
    console.error("Error en syncEtbOnly:", error);
    res.status(500).json({
      ok: false,
      message: "Error al sincronizar catálogo ETB.",
      error: error.message
    });
  }
});

// HTTP: API ETB → devuelve catálogo ETB en JSON
export const etbCatalog = onRequest(async (req, res) => {
  try {
    const snapshot = await db
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
  } catch (error: any) {
    console.error("Error en etbCatalog:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener catálogo ETB.",
      error: error.message
    });
  }
});
