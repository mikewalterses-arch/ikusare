// functions/src/makusi.ts

import { onRequest } from "firebase-functions/v2/https";
import { db } from "../firebase";
import * as cheerio from "cheerio";

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

    const ops: Promise<any>[] = [];

    // OJO: habrá que ajustar los selectores exactos mirando el HTML real
    $(".portfolio-item").each((_, el) => {
      const title = $(el).find(".head_title").text().trim();
      const link = $(el).find("a").attr("href");
      const poster = $(el).find("img").attr("src");

      if (!title || !link) return;

      const id =
        "makusi_" +
        title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

      const fullPoster =
        poster && !poster.startsWith("http")
          ? `https://makusi.eus${poster}`
          : poster || null;

      const docRef = db.collection("catalogo").doc(id);
      const p = docRef.set(
        {
          titulo: title,
          fuente: "makusi",
          makusi_url: `https://makusi.eus${link}`,
          poster: fullPoster,
          en_makusi: true,
          ultima_actualizacion_makusi: new Date().toISOString()
        },
        { merge: true }
      );

      ops.push(p);
      count++;
    });

    await Promise.all(ops);
  }

  console.log(`✅ Makusi: ${count} elementos procesados/actualizados`);
  return count;
}

export const syncMakusi = onRequest(
  {
    timeoutSeconds: 300,
    cors: true
  },
  async (req, res) => {
    try {
      console.log("Lanzando syncMakusi...");
      const imported = await syncMakusiCatalog();
      res.status(200).json({
        ok: true,
        message: "Catálogo Makusi sincronizado correctamente.",
        imported
      });
    } catch (error: any) {
      console.error("Error en syncMakusi:", error);
      res.status(500).json({
        ok: false,
        message: "Error al sincronizar catálogo Makusi.",
        error: error.message
      });
    }
  }
);
