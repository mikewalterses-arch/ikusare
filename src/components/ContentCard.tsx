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
  isEuskeraManual?: boolean;
  synopsis?: string; // por si la necesitas más adelante
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
  isEuskeraManual,
  synopsis, // ahora mismo no lo usamos en la card
}: ContentCardProps) {
  const router = useRouter();

  // ✅ Solo manual: si euskera_manual === true
  const isEuskera = isEuskeraManual === true;

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

  return (
    <div
      onClick={() => router.push(`/content/${id}`)}
      className="group relative bg-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden
                 border border-white/10 shadow-xl hover:shadow-2xl hover:shadow-[#E63946]/20
                 transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width: 768px) 40vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-gray-500 text-xs sm:text-sm font-medium">
              No poster
            </span>
          </div>
        )}

        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badge Euskera — solo si isEuskeraManual === true */}
        {isEuskera && (
          <div
            className="absolute top-2 left-2 sm:top-3 sm:left-3
                       bg-[#E63946] text-white font-bold
                       text-[8px] sm:text-[11px] uppercase tracking-wider
                       px-2 py-0.5 sm:px-4 sm:py-2
                       rounded-full shadow-2xl border border-white/20 z-10"
          >
            Euskera
          </div>
        )}

        {/* Badge tipo */}
        <div
          className="absolute top-2 right-2 sm:top-3 sm:right-3
                     bg-black/70 backdrop-blur-md text-white
                     text-[8px] sm:text-[11px] font-medium
                     px-2 py-0.5 sm:px-3 sm:py-1.5
                     rounded-full z-10"
        >
          {type === 'movie' ? 'Film' : 'Serie'}
        </div>

        {/* Plataformas */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex gap-1.5 sm:gap-2 z-10">
          {platforms.slice(0, 4).map((plat) => (
            <div
              key={plat}
              className="bg-black/70 backdrop-blur-md text-white
                         text-[8px] sm:text-[11px] font-bold
                         px-2 py-1 sm:px-2.5 sm:py-1.5
                         rounded-lg border border-white/20"
            >
              {getPlatformLabel(plat)}
            </div>
          ))}
          {platforms.length > 4 && (
            <div
              className="bg-black/70 text-white text-[8px] sm:text-[11px] font-bold
                         px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-white/20"
            >
              +{platforms.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
        <h3
          className="font-bold text-sm sm:text-base md:text-lg text-white
                     leading-tight line-clamp-2
                     group-hover:text-[#E63946] transition-colors"
        >
          {title}
        </h3>

        <div className="flex items-center justify-between text-[11px] sm:text-sm">
          <span className="text-gray-400">{year || '—'}</span>

          {typeof rating === 'number' && (
            <div
              className="flex items-center gap-1.5 bg-yellow-500/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-yellow-400 text-[11px] sm:text-sm">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="text-[9px] sm:text-xs bg-white/10 text-gray-300
                           px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/10"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="absolute inset-0 rounded-2xl ring-4 ring-[#E63946]/0 group-hover:ring-[#E63946]/30 transition-all pointer-events-none" />
    </div>
  );
}
