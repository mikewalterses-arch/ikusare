// src/components/ContentCard.tsx
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type ContentCardProps = {
  id: string;
  title: string;
  poster: string | null;
  type: 'movie' | 'serie';
  year?: string;
  rating?: number;
  genres?: string[];
  languages: string[];
  platforms: string[];
  synopsis: string;
};

export default function ContentCard({
  id,
  title,
  poster,
  type,
  year,
  rating,
  genres = [],
  languages,
  platforms,
  synopsis,
}: ContentCardProps) {
  const router = useRouter();
  const isEuskera = languages.includes('eu');

  // Iconos de plataformas (más claros y profesionales)
  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'etb': return 'ETB';
      case 'netflix': return 'N';
      case 'max': case 'hbomax': return 'MAX';
      case 'disney': case 'disney+': return 'D+';
      case 'prime': case 'primevideo': return 'Prime';
      case 'filmin': return 'filmin';
      case 'appletv': case 'apple tv+': return 'TV+';
      case 'movistar': return 'M+';
      default: return platform.toUpperCase().slice(0, 4);
    }
  };

  return (
    <div
      onClick={() => router.push(`/content/${id}`)}
      className="group relative bg-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 
                 shadow-xl hover:shadow-2xl hover:shadow-[#E63946]/20 
                 transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            unoptimized // TMDB permite hotlinking sin problemas
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-gray-500 text-sm font-medium">No poster</span>
          </div>
        )}

        {/* Overlay al hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badge EUSKERA – LIMPIO, BONITO Y SIN PARPADEOS */}
        {isEuskera && (
          <div className="absolute top-3 left-3 bg-[#E63946] text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full shadow-2xl border border-white/30 z-10">
            Euskera
          </div>
        )}

        {/* Tipo: Película o Serie */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full z-10">
          {type === 'movie' ? 'Film' : 'Serie'}
        </div>

        {/* Plataformas */}
        <div className="absolute bottom-3 right-3 flex gap-2 z-10">
          {platforms.slice(0, 4).map((plat) => (
            <div
              key={plat}
              className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-white/20"
            >
              {getPlatformLabel(plat)}
            </div>
          ))}
          {platforms.length > 4 && (
            <div className="bg-black/70 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-white/20">
              +{platforms.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Información */}
      <div className="p-5 space-y-3">
        <h3 className="font-bold text-lg text-white line-clamp-2 group-hover:text-[#E63946] transition-colors duration-300">
          {title}
        </h3>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{year || '—'}</span>
          
          {rating && (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1 rounded-full">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-yellow-400">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Géneros */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full border border-white/10"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Sinopsis (aparece al hover) */}
        <p className="text-sm text-gray-400 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {synopsis || 'Sin sinopsis disponible.'}
        </p>
      </div>

      {/* Efecto glow rojo al hover */}
      <div className="absolute inset-0 rounded-2xl ring-4 ring-[#E63946]/0 group-hover:ring-[#E63946]/30 transition-all duration-500 pointer-events-none" />
    </div>
  );
}