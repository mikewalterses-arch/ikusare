// src/app/content/[id]/ContentDetailClient.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, ArrowLeft, BookmarkPlus } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

type ContentDetailClientProps = {
  id: string;
};

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

export default function ContentDetailClient({ id }: ContentDetailClientProps) {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const user = auth.currentUser;

  // Cargar datos de la película + estado favorito
  useEffect(() => {
    const load = async () => {
      try {
        // 1) Película
        const ref = doc(db, 'catalogo', id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setMovie(null);
          setLoading(false);
          return;
        }

        const data = snap.data() as Omit<Movie, 'id'>;
        const movieData: Movie = { id, ...data };
        setMovie(movieData);

        // 2) Comprobar favorito (solo si hay usuario)
        if (auth.currentUser) {
          const favRef = doc(
            db,
            'users',
            auth.currentUser.uid,
            'favorites',
            id,
          );
          const favSnap = await getDoc(favRef);
          setIsFavorite(favSnap.exists());
        }
      } catch (err) {
        console.error('Error cargando contenido:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const platforms = useMemo(() => {
    if (!movie) return [] as string[];
    return [
      movie.netflix && 'netflix',
      movie.etb && 'etb',
      movie.disney && 'disney',
      movie.prime && 'prime',
      movie.filmin && 'filmin',
      movie['apple tv'] && 'appletv',
    ].filter(Boolean) as string[];
  }, [movie]);

  const isEuskera =
    movie &&
    (typeof movie.euskera_manual === 'boolean'
      ? movie.euskera_manual
      : movie.idiomas_disponibles?.includes('eu'));

  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'etb':
        return 'ETB';
      case 'netflix':
        return 'N';
      case 'max':
      case 'hbomax':
        return 'MAX';
      case 'disney':
      case 'disney+':
        return 'D+';
      case 'prime':
      case 'primevideo':
        return 'Prime';
      case 'filmin':
        return 'Filmin';
      case 'appletv':
      case 'apple tv+':
        return 'TV+';
      case 'movistar':
        return 'M+';
      default:
        return platform.toUpperCase().slice(0, 4);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Debes iniciar sesión para guardar favoritos.');
      return;
    }

    setFavLoading(true);
    try {
      const favRef = doc(db, 'users', user.uid, 'favorites', id);

      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
      } else {
        await setDoc(favRef, {
          movieId: id,
          savedAt: new Date().toISOString(),
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error al actualizar favorito:', err);
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <div className="animate-spin w-12 h-12 border-4 border-[#E63946] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-white px-6 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <p>No se ha encontrado esta película.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 text-white">
      {/* Volver */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,280px)_1fr] gap-8 md:gap-10 items-start">
        {/* Poster grande */}
        <div className="relative w-full max-w-xs mx-auto md:mx-0">
          <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900">
            {movie.poster ? (
              <Image
                src={movie.poster}
                alt={movie.titulo || movie.title || ''}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                Sin poster
              </div>
            )}

            {/* Badge Euskera */}
            {isEuskera && (
              <div className="absolute top-3 left-3 bg-[#E63946] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Euskera
              </div>
            )}

            {/* Tipo */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-xs px-3 py-1 rounded-full">
              {movie.tipo === 'movie' ? 'Film' : 'Serie'}
            </div>

            {/* Plataformas en poster */}
            {platforms.length > 0 && (
              <div className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
                {platforms.map((plat) => (
                  <div
                    key={plat}
                    className="bg-black/70 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20"
                  >
                    {getPlatformLabel(plat)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info principal */}
        <div className="space-y-6">
          {/* Título + acciones */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {movie.titulo || movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                {movie.año && <span>{movie.año}</span>}
                {movie.rating && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">
                      {movie.rating.toFixed(1)}
                    </span>
                  </span>
                )}
                {movie.idiomas_disponibles && movie.idiomas_disponibles.length > 0 && (
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full border border-white/10">
                    Idiomas: {movie.idiomas_disponibles.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Botones principales */}
            <div className="flex items-center gap-3">
              {/* Favorito */}
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition
                  ${
                    isFavorite
                      ? 'bg-[#E63946] border-[#E63946] text-white'
                      : 'bg-black/40 border-white/20 text-gray-200 hover:bg:white/5'
                  }`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? 'fill-white' : 'fill-transparent'
                  }`}
                />
                <span className="text-sm">
                  {isFavorite ? 'Guardada' : 'Guardar'}
                </span>
              </button>

              {/* Añadir a lista (placeholder) */}
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/30 text-gray-200 hover:bg-white/5 text-sm"
                onClick={() =>
                  alert('Listas personalizadas llegarán en la Fase 2 😉')
                }
              >
                <BookmarkPlus className="w-5 h-5" />
                Listas
              </button>
            </div>
          </div>

          {/* Géneros */}
          {movie.generos && movie.generos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.generos.map((g) => (
                <span
                  key={g}
                  className="text-xs bg:white/10 text-gray-200 px-3 py-1 rounded-full border border:white/10"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Sinopsis */}
          {movie.sinopsis && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Sinopsis</h2>
              <p className="text-gray-200 leading-relaxed">
                {movie.sinopsis}
              </p>
            </div>
          )}

          {/* Placeholder futuro */}
          <div className="mt-6 border-t border-white/10 pt-6 text-sm text-gray-400">
            Aquí después añadiremos:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recomendaciones similares</li>
              <li>Comentarios y reseñas de otros usuarios</li>
              <li>Historial de vistas y estadísticas personales</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
