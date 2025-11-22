// functions/src/sync/primeran.ts

import { onRequest } from "firebase-functions/v2/https";
import { db } from "../firebase";

/**
 * TODO: cuando identifiques la API real de Primeran desde DevTools,
 * rellena estas URLs.
 *
 * Por ejemplo (inventado):
 *  - https://primeran.eus/api/v1/videos?language=eu
 *  - https://primeran.eus/api/v1/series?language=eu
 */
const PRIMERAN_SOURCES: string[] = [
  "https://primeran.eus/API_ENDPOINT_1_AQUI",
  "https://primeran.eus/API_ENDPOINT_2_AQUI",
  // añade más si hace falta
];

/**
 * Tipo genérico de un item de Primeran.
 * De momento lo dejamos como any y lo documentamos.
 * Cuando veas el JSON real, puedes tipar mejor esto.
 */
type PrimeranRawItem = any;

/**
 * Mapea un objeto crudo de Primeran al formato de tu colección "catalogo".
 * Aquí es donde decides qué campos quieres guardar.
 */
function mapPrimeranItemToCatalogDoc(item: PrimeranRawItem) {
  // TODO: adapta estos campos en función del JSON real de Primeran
  const idOriginal = item.id || item.uuid || item.slug || item.code;

  const titulo: string =
    item.title?.eu ||
    item.title?.es ||
    item.name?.eu ||
    item.name?.es ||
    item.title ||
    "Sin título";

  const sinopsis: string =
    item.description?.eu ||
    item.description?.es ||
    item.overview?.eu ||
    item.overview?.es ||
    item.description ||
    item.overview ||
    "";

  const poster: string | null =
    item.imageUrl ||
    item.posterUrl ||
    item.thumbnail ||
    null;

  const año: number | null = item.year || null;

  // Idioma principal: asumimos euskera, pero ajusta según el JSON
  const idiomaOriginal: string | null = item.language || "eu";

  return {
    // Campos comunes de tu catálogo
    titulo,
    sinopsis,
    año,
    poster,
    idioma_original: idiomaOriginal,

    // Identidad
    primeran_id: idOriginal,
    platform: "Primeran",
    fuente: "primeran",

    // Flags útiles
    en_primeran: true,
    original_eu: idiomaOriginal === "eu",

    // Marca de tiempo de la sync
    ultima_actualizacion_primeran: new Date().toISOString(),
  };
}

async function fetchPrimeranUrl(url: string): Promise<PrimeranRawItem[]> {
  console.log("[Primeran] Fetch URL:", url);
  const res = await fetch(url);

  if (!res.ok) {
    console.error("[Primeran] Error HTTP", res.status, "en", url);
    return [];
  }

  const data = await res.json().catch((e) => {
    console.error("[Primeran] Error parseando JSON:", e);
    return null;
  });

  if (!data) return [];

  /**
   * Aquí hay que adaptar según el JSON real.
   * Ejemplos típicos:
   *
   *  - data.results
   *  - data.items
   *  - data.data
   *  - directamente un array
   */
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any).results)) return (data as any).results;
  if (Array.isArray((data as any).items)) return (data as any).items;

  console.warn("[Primeran] Formato JSON no esperado, devolviendo []");
  return [];
}

/**
 * Sync principal: recorre todas las URLs de PRIMERAN_SOURCES,
 * mapea elementos y los guarda/actualiza en "catalogo".
 */
async function syncPrimeranCatalog() {
  console.log("IKUSARE: sincronización Primeran…");

  let total = 0;

  for (const url of PRIMERAN_SOURCES) {
    const items = await fetchPrimeranUrl(url);
    console.log(`[Primeran] ${items.length} items obtenidos de`, url);

    const ops: Promise<any>[] = [];

    for (const raw of items) {
      const mapped = mapPrimeranItemToCatalogDoc(raw);

      // Creamos un id estable tipo "primeran_<algo>"
      const baseId =
        mapped.primeran_id ||
        mapped.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const id =
        "primeran_" +
        String(baseId)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

      const docRef = db.collection("catalogo").doc(id);

      const p = docRef.set(
        {
          ...mapped,
        },
        { merge: true }
      );

      ops.push(p);
      total++;
    }

    await Promise.all(ops);
  }

  console.log(`✅ Primeran: ${total} elementos procesados/actualizados`);
  return total;
}

/**
 * Función HTTP para lanzar la sync de Primeran desde el panel Admin.
 */
export const syncPrimeran = onRequest(
  {
    timeoutSeconds: 300,
    cors: true,
  },
  async (req, res) => {
    try {
      const total = await syncPrimeranCatalog();
      res.status(200).json({
        ok: true,
        message: "Catálogo Primeran sincronizado correctamente.",
        imported: total,
      });
    } catch (error: any) {
      console.error("Error en syncPrimeran:", error);
      res.status(500).json({
        ok: false,
        message: "Error al sincronizar catálogo Primeran.",
        error: error.message,
      });
    }
  }
);
