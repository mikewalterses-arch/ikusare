"use client";

import { useState } from "react";

export default function AdminHome() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ Sustituye esta URL por la que te dé Firebase en la consola (Functions -> syncCatalogHttp)
  const SYNC_URL =
    "https://us-central1-ikusmira-7a46d.cloudfunctions.net/syncCatalogHttp";

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(SYNC_URL, {
        method: "POST", // o "GET" si lo prefieres
      });

      if (!res.ok) {
        throw new Error("Error HTTP " + res.status);
      }

      const data = await res.json().catch(() => null);
      setMessage(data?.message || "Catálogo sincronizado correctamente.");
    } catch (e: any) {
      console.error(e);
      setError("No se ha podido sincronizar el catálogo.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Tarjeta: sincronizar catálogo */}
        <div className="p-5 bg-[#1D3557] rounded-xl flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Sincronizar catálogo</h2>
          <p className="text-gray-300 text-sm">
            Lanza ahora la actualización con TMDB: nuevas plataformas, idiomas y
            detección de euskera. Útil después de cambios importantes.
          </p>
          <button
            onClick={handleSync}
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#E63946] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E63946]/80 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Sincronizando..." : "Sincronizar catálogo ahora"}
          </button>

          {message && (
            <p className="text-sm text-green-400 mt-1">
              ✅ {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-400 mt-1">
              ⚠️ {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

