// src/app/(admin)/admin/movies/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type MovieListItem = {
  id: string;
  titulo?: string;
  title?: string;
  año?: string | number;
};

export default function AdminMovies() {
  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "catalogo"));
      const list = snap.docs.map((d) => ({
        id: d.id, // 👈 MUY IMPORTANTE: usamos el ID del documento
        ...(d.data() as Omit<MovieListItem, "id">),
      }));
      setMovies(list);
    };

    load();
  }, []);

  const filtered = movies.filter((m) => {
    const text = (m.titulo || m.title || "").toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Editar Películas</h1>

      <input
        type="text"
        placeholder="Buscar película..."
        className="w-full px-4 py-3 rounded-xl bg-[#1D3557] border border-white/10 mb-6"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-4">
        {filtered.map((m) => (
          <a
            key={m.id}
            href={`/admin/movies/${m.id}`} // 👈 URL construida con doc.id
            className="block p-4 bg-[#1D3557] rounded-xl hover:bg-[#E63946]/20 transition"
          >
            <p className="text-xl font-semibold">{m.titulo || m.title}</p>
            {m.año && (
              <p className="text-gray-300 text-sm">Año: {String(m.año)}</p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
