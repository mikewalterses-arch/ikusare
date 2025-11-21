"use client";

import { useCallback, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

export type FavoriteItem = {
  id: string;
  title: string;
  poster?: string;
  year?: number;
  euskera_manual?: boolean;
  [key: string]: any;
};

type UseFavoritesReturn = {
  favorites: FavoriteItem[];
  loading: boolean;
  error: string | null;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
};

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de favoritos del usuario logueado
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError(null);

        const favCol = collection(db, "users", user.uid, "favorites");
        const snap = await getDocs(favCol);

        const items: FavoriteItem[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title ?? "",
            poster: data.poster ?? "",
            year: data.year,
            euskera_manual: data.euskera_manual ?? false,
          };
        });

        setFavorites(items);
      } catch (err) {
        console.error("Error cargando favoritos:", err);
        setError("No se han podido cargar los favoritos.");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const isFavorite = useCallback(
    (id: string) => {
      return favorites.some((f) => f.id === id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (item: FavoriteItem) => {
      const user = auth.currentUser;
      if (!user) {
        alert(
          "Debes iniciar sesión para guardar favoritos.\nSaioa hasi behar duzu gogokoak gordetzeko."
        );
        return;
      }

      try {
        const favRef = doc(db, "users", user.uid, "favorites", item.id);

        if (favorites.some((f) => f.id === item.id)) {
          // Ya es favorito -> eliminar
          await deleteDoc(favRef);
          setFavorites((prev) => prev.filter((f) => f.id !== item.id));
        } else {
          // No es favorito -> crear
          await setDoc(favRef, {
            title: item.title ?? "",
            poster: item.poster ?? "",
            year: item.year ?? null,
            euskera_manual: !!item.euskera_manual,
            savedAt: new Date().toISOString(),
          });
          setFavorites((prev) => [...prev, item]);
        }
      } catch (err) {
        console.error("Error al actualizar favorito:", err);
        setError("No se ha podido actualizar el favorito.");
      }
    },
    [favorites]
  );

  return {
    favorites,
    loading,
    error,
    isFavorite,
    toggleFavorite,
  };
}
