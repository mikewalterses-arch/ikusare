"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Movie = {
  id: string;
  titulo?: string;
  title?: string;
  año?: number | string;
  euskera_manual?: boolean;
  [key: string]: any;
};

export default function EditMovieClient({ id }: { id: string }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        console.log("[EditMovie] Cargando película con id:", id);
        const ref = doc(db, "catalogo", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn("[EditMovie] Documento no encontrado para id:", id);
          setError(`Película no encontrada (id: ${id})`);
        } else {
          const data = snap.data();
          console.log("[EditMovie] Datos cargados:", data);
          setMovie({ id, ...(data as Omit<Movie, "id">) });
        }
      } catch (err: any) {
        console.error("[EditMovie] Error cargando película:", err);
        setError("Error cargando la película");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSave = async () => {
    if (!movie) return;
    setSaving(true);
    setError(null);

    try {
      const ref = doc(db, "catalogo", movie.id);
      await updateDoc(ref, {
        ...movie,
        euskera_manual: !!movie.euskera_manual,
      });
      alert("Cambios guardados");
    } catch (err: any) {
      console.error("[EditMovie] Error guardando cambios:", err);
      setError("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando…
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error || "Película no encontrada"}
      </div>
    );
  }

  return (
    <div className="text-white px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Editar: {movie.titulo || movie.title}
      </h1>

      <label className="flex items-center gap-3 mb-6">
        <input
          type="checkbox"
          checked={movie.euskera_manual || false}
          onChange={(e) =>
            setMovie({ ...movie, euskera_manual: e.target.checked })
          }
        />
        <span className="text-lg">
          Disponible en Euskera (confirmado por admin)
        </span>
      </label>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`px-6 py-3 rounded-xl font-medium transition ${
          saving
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-[#E63946] hover:bg-red-600"
        }`}
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
