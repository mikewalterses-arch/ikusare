"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLists, UserList } from "../../../../hooks/useLists";
import Link from "next/link";
import Image from "next/image";

type ContentItem = {
  id: string;
  titulo?: string;
  title?: string;
  poster?: string;
  año?: number;
  rating?: number;
};

export default function ListDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listId = params.id;

  const { lists, removeFromList, deleteList } = useLists();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const list = useMemo<UserList | undefined>(
    () => lists.find((l: UserList) => l.id === listId),
    [lists, listId]
  );

  useEffect(() => {
    const loadItems = async () => {
      if (!list) {
        setLoading(false);
        return;
      }

      if (!list.items || list.items.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const promises = list.items.map(async (contentId: string) => {
        const ref = doc(db, "catalogo", contentId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        const data = snap.data() as any;
        return {
          id: snap.id,
          titulo: data.titulo,
          title: data.title,
          poster: data.poster,
          año: data.año,
          rating: data.rating,
        } as ContentItem;
      });

      const results = await Promise.all(promises);
      setItems(results.filter(Boolean) as ContentItem[]);
      setLoading(false);
    };

    loadItems();
  }, [list]);

  const handleDeleteList = async () => {
    if (!list) return;
    const ok = window.confirm(
      `¿Eliminar la lista "${list.name}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    await deleteList(list.id);
    router.push("/profile");
  };

  if (!list && !loading) {
    return (
      <div className="px-6 py-8 text-white">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 mb-4 hover:underline"
        >
          ← Volver
        </button>
        <p>No se ha encontrado la lista.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 text-white">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:underline"
        >
          ← Volver
        </button>

        {list && (
          <button
            onClick={handleDeleteList}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Eliminar lista
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-1">{list?.name ?? "Lista"}</h1>
      <p className="text-sm text-gray-400 mb-6">
        {list?.items.length ?? 0} elementos
      </p>

      {loading ? (
        <p className="text-gray-400">Cargando contenido…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">
          Esta lista está vacía. Añade contenido desde la ficha de películas o
          series.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const displayTitle = item.titulo || item.title || "";
            return (
              <div
                key={item.id}
                className="relative group rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden"
              >
                <Link href={`/content/${item.id}`}>
                  <div className="aspect-[2/3] w-full relative">
                    {item.poster ? (
                      <Image
                        src={item.poster}
                        alt={displayTitle}
                        fill
                        className="object-cover group-hover:opacity-90"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Sin póster
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold line-clamp-2">
                      {displayTitle}
                    </p>
                    {item.año && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {item.año}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => removeFromList(listId, item.id)}
                  className="absolute top-1 right-1 text-[10px] px-2 py-1 rounded bg-black/70 text-white opacity-80 hover:opacity-100"
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
