"use client";

import Link from "next/link";
import { useLists, UserList } from "../../../hooks/useLists";

export default function ListsPage() {
  const { lists, loading, createList } = useLists();

  const handleCreateQuick = async () => {
    const name = window.prompt("Nombre de la lista:");
    if (!name) return;
    await createList(name.trim());
  };

  return (
    <div className="px-6 py-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis listas</h1>
        <button
          onClick={handleCreateQuick}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium"
        >
          Crear nueva lista
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando listas…</p>
      ) : lists.length === 0 ? (
        <p className="text-gray-400">
          Aún no tienes listas creadas. Crea una y empieza a llenarla con
          contenido.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list: UserList) => (
            <Link
              key={list.id}
              href={`/profile/lists/${list.id}`}
              className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 transition border border-slate-700"
            >
              <h2 className="text-lg font-semibold mb-1">{list.name}</h2>
              <p className="text-sm text-gray-400">
                {list.items.length} elementos
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
