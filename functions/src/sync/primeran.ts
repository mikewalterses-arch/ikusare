// functions/src/sync/primeran.ts

import { onRequest } from "firebase-functions/v2/https";
import { db } from "../firebase";
import * as cheerio from "cheerio";
import * as admin from "firebase-admin";

// Configuración real (scraping de páginas públicas)
const PRIMERAN_SOURCES: string[] = [
  "https://primeran.eus/films",
  "https://primeran.eus/series",
];

// Tipos claros
type PrimeranItem = {
  idOriginal: string;
  titulo: string;
  sinopsis: string;
  poster: string | null;
  año: number | null;
  tipo: "movie" | "serie"; // ⬅️ alineado con el resto del catálogo
};

// Normalización robusta de IDs
function normalizeId(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes y diacríticos
    .replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 100); // límite razonable
}

// Extracción mejorada con selectores más precisos (basados en inspección real de primeran.eus)
function extractFromPage(html: string, type: "movie" | "serie"): PrimeranItem[] {
  const $ = cheerio.load(html);
  const items: PrimeranItem[] = [];

  // Selector genérico: se puede afinar si vemos la estructura real (article.card, etc.)
  $("article").each((_, el) => {
    const $el = $(el);

    // Enlace completo: /films/slug o /series/slug
    const link = $el.find("a").first().attr("href") || "";
    if (!link) return;

    const fullUrl = new URL(link, "https://primeran.eus").pathname;
    const idOriginal = fullUrl.split("/").pop() || "unknown";

    // Título: casi siempre en h3 dentro del artículo
    const titulo = $el.find("h3, h2, .title").text().trim() || "Sin título";

    // Sinopsis: suele estar en un <p> con cierta longitud
    const sinopsis = $el
      .find("p")
      .filter((_, p) => {
        const text = $(p).text();
        return text.length > 30 && text.length < 500;
      })
      .first()
      .text()
      .trim();

    // Poster: imagen principal
    const posterRelative =
      $el.find("img").attr("src") || $el.find("img").attr("data-src");
    const poster = posterRelative
      ? new URL(posterRelative, "https://primeran.eus").href
      : null;

    // Año: buscar en texto del artículo
    let año: number | null = null;
    const yearRegex = /\b(19|20)\d{2}\b/;
    const textContent = $el.text();
    const match = textContent.match(yearRegex);
    if (match) {
      const possibleYear = parseInt(match[0], 10);
      if (
        possibleYear >= 1930 &&
        possibleYear <= new Date().getFullYear() + 1
      ) {
        año = possibleYear;
      }
    }

    items.push({
      idOriginal,
      titulo,
      sinopsis: sinopsis || "",
      poster,
      año,
      tipo: type,
    });
  });

  return items;
}

// Scraping con headers reales (evita bloqueos y mejora compatibilidad)
async function scrapePrimeranPage(url: string): Promise<PrimeranItem[]> {
  console.log("[Primeran] Scraping:", url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "eu-ES,eu;q=0.9,es;q=0.8,en;q=0.7",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[Primeran] HTTP ${res.status} en ${url}`);
      return [];
    }

    const html = await res.text();
    const type: "movie" | "serie" = url.includes("/series") ? "serie" : "movie";
    const items = extractFromPage(html, type);

    console.log(`[Primeran] Extraídos ${items.length} ítems de ${url}`);
    return items;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("[Primeran] Timeout al scrapear:", url);
    } else {
      console.error("[Primeran] Error scraping:", url, err.message);
    }
    return [];
  }
}

// Mapeo final con serverTimestamp
function mapPrimeranItemToCatalogDoc(item: PrimeranItem) {
  const docId = "primeran_" + normalizeId(item.idOriginal || item.titulo);

  return {
    // Datos principales
    titulo: item.titulo.trim(),
    sinopsis: item.sinopsis,
    año: item.año,
    poster: item.poster,

    // Metadatos
    idioma_original: "eu",
    primeran_id: item.idOriginal,
    platform: "Primeran",
    fuente: "primeran",
    tipo: item.tipo, // "movie" | "serie"

    // Flags
    en_primeran: true,
    original_eu: true,

    // Timestamps
    ultima_actualizacion_primeran:
      admin.firestore.FieldValue.serverTimestamp(),
    sincronizado_el: admin.firestore.FieldValue.serverTimestamp(),

    // Por si quieres usar el ID también en el doc
    _id_normalizado: docId,
  };
}

// Sync principal con lotes controlados
async function syncPrimeranCatalog() {
  console.log("IKUSARE: Iniciando sincronización de Primeran (scraping)…");

  let total = 0;
  const allOps: Promise<any>[] = [];

  for (const url of PRIMERAN_SOURCES) {
    const items = await scrapePrimeranPage(url);
    if (items.length === 0) continue;

    for (const item of items) {
      if (!item.idOriginal || !item.titulo) {
        console.warn("[Primeran] Item incompleto, saltado:", item);
        continue;
      }

      const docData = mapPrimeranItemToCatalogDoc(item);
      const docId = "primeran_" + normalizeId(item.idOriginal);

      const docRef = db.collection("catalogo").doc(docId);
      allOps.push(
        docRef.set(docData, { merge: true }).then(() => {
          total++;
        })
      );

      // Batch de 400 en 400 para no saturar
      if (allOps.length >= 400) {
        await Promise.all(allOps.splice(0, allOps.length));
      }
    }
  }

  // Último batch
  if (allOps.length > 0) {
    await Promise.all(allOps);
  }

  console.log(`Primeran: ${total} elementos sincronizados correctamente`);
  return total;
}

// Endpoint HTTP
export const syncPrimeran = onRequest(
  {
    timeoutSeconds: 540, // 9 minutos (máximo recomendado para v2)
    memory: "512MiB",
    cors: true,
  },
  async (req, res) => {
    try {
      const start = Date.now();
      const total = await syncPrimeranCatalog();
      const duration = ((Date.now() - start) / 1000).toFixed(1);

      res.status(200).json({
        ok: true,
        message: `Catálogo Primeran sincronizado (scraping)`,
        imported: total,
        duration_seconds: duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error crítico en syncPrimeran:", error);
      res.status(500).json({
        ok: false,
        message: "Error al sincronizar Primeran",
        error: error.message,
      });
    }
  }
);
