"use client";

import { useState } from "react";

type SyncTarget = "makusi" | "etb" | "tmdb" | "primeran" | "all";

// ⚠️ RELLENA ESTAS URLs CON LAS QUE VES EN FIREBASE → FUNCTIONS
// Deben ser las de Cloud Run, tipo: https://syncmakusi-XXXX-uc.a.run.app
const ENDPOINTS: Record<Exclude<SyncTarget, "all">, string> = {
  makusi: "https://syncmakusi-XXXX-uc.a.run.app",
  etb: "https://syncetbonly-XXXX-uc.a.run.app",
  tmdb: "https://synccataloghttp-XXXX-uc.a.run.app",
  primeran: "https://syncprimeran-XXXX-uc.a.run.app",
};

export default function AdminHome() {
  const [loadingTarget, setLoadingTarget] = useState<SyncTarget | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callEndpoint = async (target: Exclude<SyncTarget, "all">) => {
    const url = ENDPOINTS[target];

    const res = await fetch(url, {
      method: "POST",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    }

    return data as { ok: boolean; message?: string; imported?: number };
  };

  const handleSync = async (target: SyncTarget) => {
    setLoadingTarget(target);
    setMessage(null);
    setError(null);

    try {
      if (target === "all") {
        // Ejecuta TMDB → ETB → Makusi → Primeran en secuencia
        const results: string[] = [];
        let totalImported = 0;

        // 1) TMDB (todas las plataformas soportadas por TMDB)
        const tmdbResult = await callEndpoint("tmdb");
        if (tmdbResult.imported != null) {
          totalImported += tmdbResult.imported;
        }
        results.push(tmdbResult.message || "TMDB sincronizado.");

        // 2) ETB
        const etbResult = await callEndpoint("etb");
        if (etbResult.imported != null) {
          totalImported += etbResult.imported;
        }
        results.push(etbResult.message || "ETB sincronizado.");

        // 3) Makusi
        const makusiResult = await callEndpoint("makusi");
        if (makusiResult.imported != null) {
          totalImported += makusiResult.imported;
        }
        results.push(makusiResult.message || "Makusi sincronizado.");

        // 4) Primeran
        const primeranResult = await callEndpoint("primeran");
        if (primeranResult.imported != null) {
          totalImported += primeranResult.imported;
        }
        results.push(primeranResult.message || "Primeran sincronizado.");

        const resumen =
          results.join(" ") +
          (totalImported
            ? ` Elementos importados/actualizados en total: ${totalImported}.`
            : "");

        setMessage(resumen || "Sync de todas las fuentes completado.");
        return;
      }

      // Caso simple: una fuente concreta (makusi, etb, tmdb o primeran)
      const data = await callEndpoint(target);
      const imported = data.imported;
      const sourceLabel = target.toUpperCase();

      setMessage(
        imported != null
          ? `Sync de ${sourceLabel} completada. Elementos importados/actualizados: ${imported}.`
          : data.message || `Sync de ${sourceLabel} completada correctamente.`
      );
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message ||
          "No se ha podido sincronizar. Revisa los logs de Firebase."
      );
    } finally {
      setLoadingTarget(null);
    }
  };

  const isLoading = (target: SyncTarget) => loadingTarget === target;

  return (
    <div className="text-white px-6 py-10 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
      <p className="text-gray-300">
        Herramientas para mantener el catálogo y el contenido en euskera al día.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tarjeta: edición de películas/series */}
        <a
          href="/admin/movies"
          className="p-5 bg-[#1D3557] rounded-xl hover:bg-[#E63946]/20 transition"
        >
          <h2 className="text-xl font-semibold mb-1">
            Editar Películas / Series
          </h2>
          <p className="text-gray-300">
            Editar títulos, idiomas, plataformas, marcar euskera_manual…
          </p>
        </a>

        {/* Tarjeta: sincronización por fuentes */}
        <div className="p-5 bg-[#1D3557] rounded-xl flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Sincronizar catálogo</h2>
          <p className="text-gray-300 text-sm">
            Lanza la sincronización por fuente: Makusi (selección en euskera),
            ETB/Primeran Nahieran o proveedores TMDB (Netflix, Disney, Prime,
            etc.). También puedes lanzar un sync general.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => handleSync("makusi")}
              disabled={isLoading("makusi")}
              className="rounded-lg bg-[#E63946] px-3 py-2 text-xs font-semibold text-white hover:bg-[#E63946]/80 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading("makusi") ? "Sync Makusi..." : "Sync Makusi"}
            </button>

            <button
              onClick={() => handleSync("etb")}
              disabled={isLoading("etb")}
              className="rounded-lg bg-[#457B9D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#457B9D]/80 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading("etb") ? "Sync ETB..." : "Sync ETB"}
            </button>

            <button
              onClick={() => handleSync("tmdb")}
              disabled={isLoading("tmdb")}
              className="rounded-lg bg-[#A8DADC] px-3 py-2 text-xs font-semibold text-black hover:bg-[#A8DADC]/80 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading("tmdb") ? "Sync TMDB..." : "Sync TMDB"}
            </button>

            <button
              onClick={() => handleSync("primeran")}
              disabled={isLoading("primeran")}
              className="rounded-lg bg-[#F4A261] px-3 py-2 text-xs font-semibold text-black hover:bg-[#F4A261]/80 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading("primeran") ? "Sync Primeran..." : "Sync Primeran"}
            </button>

            <button
              onClick={() => handleSync("all")}
              disabled={isLoading("all")}
              className="col-span-2 rounded-lg bg-[#1D3557] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D3557]/80 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading("all") ? "Sync TODO..." : "Sync TODO"}
            </button>
          </div>

          {message && (
            <p className="text-sm text-green-400 mt-2">✅ {message}</p>
          )}
          {error && (
            <p className="text-sm text-red-400 mt-2">⚠️ {error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
