// src/app/(main)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import ContentCard from '@/components/ContentCard';

type Movie = {
  id: string;
  titulo?: string;
  title?: string;
  poster?: string;
  tipo?: 'movie' | 'serie';
  año?: number;
  rating?: number;
  generos?: string[];
  idiomas_disponibles?: string[];
  netflix?: boolean;
  etb?: boolean;
  disney?: boolean;
  prime?: boolean;
  filmin?: boolean;
  'apple tv'?: boolean;
  sinopsis?: string;
  euskera_manual?: boolean;
  [key: string]: any;
};

export default function ProfilePage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      // 1) IDs de favoritos del usuario
      const favSnap = await getDocs(
        collection(db, 'users', user.uid, 'favorites'),
      );
      const favIds = favSnap.docs.map((d) => d.id);

      if (favIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // 2) Cargamos el catálogo y filtramos por esos IDs
      const catSnap = await getDocs(collection(db, 'catalogo'));
      const all: Movie[] = catSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Movie, 'id'>),
      }));

      setFavorites(all.filter((m) => favIds.includes(m.id)));
      setLoading(false);
    };

    load();
  }, [router]);

  const handleRemoveFavorite = async (movieId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(doc(db, 'users', user.uid, 'favorites', movieId));
    setFavorites((prev) => prev.filter((m) => m.id !== movieId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin w-16 h-16 border-4 border-[#E63946] border-t-transparent rounded-full" />
      </div>
    );
  }

  const user = auth.currentUser;

  if (!user) {
    return (
      <div className="text-white px-6 py-10">
        <p>Debes iniciar sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Tu perfil</h1>
      <p className="text-gray-300 mb-8">
        @{user.email?.split('@')[0]} · Tus películas guardadas
      </p>

      {favorites.length === 0 && (
        <p className="text-gray-400">Todavía no has guardado ninguna película.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {favorites.map((movie) => (
          <div key={movie.id} className="flex flex-col gap-2">
            <ContentCard
              id={movie.id}
              title={movie.titulo || movie.title || ''}
              poster={movie.poster ?? null}
              type={(movie.tipo as 'movie' | 'serie') || 'movie'}
              year={movie.año ? String(movie.año) : undefined}
              rating={movie.rating}
              genres={movie.generos || []}
              languages={movie.idiomas_disponibles || []}
              platforms={[
                movie.netflix && 'netflix',
                movie.etb && 'etb',
                movie.disney && 'disney',
                movie.prime && 'prime',
                movie.filmin && 'filmin',
                movie['apple tv'] && 'appletv',
              ].filter(Boolean) as string[]}
              synopsis={movie.sinopsis || ''}
              isEuskeraManual={movie.euskera_manual}
            />

            {/* Botón para quitar de favoritos */}
            <button
              onClick={() => handleRemoveFavorite(movie.id)}
              className="text-xs sm:text-sm text-red-300 hover:text-red-400 mt-1 self-start"
            >
              Quitar de favoritos
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
