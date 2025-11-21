'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ContentCard from '@/components/ContentCard';

type ContentItem = {
  id: string;
  title: string;
  poster: string | null;
  type: 'movie' | 'serie';
  year?: string;
  rating: number;
  genres: string[];
  languages: string[];
  platforms: string[];
  isEuskeraManual: boolean;
};

const GENRES = [
  'Acción',
  'Aventura',
  'Drama',
  'Comedia',
  'Thriller',
  'Ciencia ficción',
  'Animación',
  'Documental',
];

const PLATFORMS = [
  'Netflix',
  'HBO Max',
  'Disney+',
  'Prime Video',
  'Filmin',
  'Movistar+',
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export default function SearchPage() {
  const [lang, setLang] = useState<'es' | 'eu'>('es');

  const t = {
    title: lang === 'es' ? 'Buscador avanzado' : 'Bilaketa aurreratua',
    subtitle:
      lang === 'es'
        ? 'Filtra por título, género, año, plataforma e idioma.'
        : 'Iragazi izenburu, generoa, urtea, plataforma eta hizkuntzaren arabera.',
    labelTitle: lang === 'es' ? 'Título' : 'Izenburua',
    placeholderTitle:
      lang === 'es' ? 'Escribe para buscar...' : 'Idatzi bilatzeko...',
    labelGenre: lang === 'es' ? 'Género' : 'Generoa',
    labelYear: lang === 'es' ? 'Año' : 'Urtea',
    labelPlatform: lang === 'es' ? 'Plataforma' : 'Plataforma',
    any: lang === 'es' ? 'Cualquiera' : 'Edozein',
    onlyBasque:
      lang === 'es' ? 'Disponible en euskera' : 'Euskaraz eskuragarri',
    onlyHighRating: lang === 'es' ? 'Rating ≥ 8' : 'Rating ≥ 8',
    onlyManual:
      lang === 'es'
        ? 'Solo validado manualmente'
        : 'Eskuz balidatutakoak soilik',
    loading:
      lang === 'es' ? 'Cargando catálogo...' : 'Katalogoa kargatzen...',
    errorLoading:
      lang === 'es'
        ? 'Error al cargar el catálogo.'
        : 'Errorea katalogoa kargatzean.',
    noResults:
      lang === 'es'
        ? 'No hay resultados con estos filtros. Prueba a cambiar alguno.'
        : 'Ez dago emaitzarik irizpide hauekin. Saiatu batzuk aldatzen.',
    results: (n: number) =>
      lang === 'es'
        ? `${n} resultado${n === 1 ? '' : 's'} encontrado${
            n === 1 ? '' : 's'
          }`
        : `${n} emaitza aurkitu`,
    languageLabel: lang === 'es' ? 'Idioma' : 'Hizkuntza',
  };

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [titleFilter, setTitleFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [onlyEuskera, setOnlyEuskera] = useState(false);
  const [onlyHighRating, setOnlyHighRating] = useState(false);
  const [onlyEuskeraManual, setOnlyEuskeraManual] = useState(false);

  // Debounced title
  const [debouncedTitle, setDebouncedTitle] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTitle(titleFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [titleFilter]);

  // Cargar catálogo
  useEffect(() => {
    const fetchContents = async () => {
      try {
        const colRef = collection(db, 'catalogo'); // 👈 tu colección
        const snap = await getDocs(colRef);
        const data: ContentItem[] = snap.docs.map((doc) => {
          const raw = doc.data() as any;
          return {
            id: doc.id,
            title: raw.titulo || raw.title || 'Sin título',
            poster: raw.poster || null,
            type: (raw.tipo as 'movie' | 'serie') || 'movie',
            year: raw.año ? String(raw.año) : undefined,
            rating: raw.rating ?? 0,
            genres: raw.generos || [],
            languages: raw.idiomas_disponibles || [],
            platforms: [
              ...(raw.netflix ? ['Netflix'] : []),
              ...(raw.etb ? ['ETB'] : []),
              ...(raw.disney ? ['Disney+'] : []),
              ...(raw.prime ? ['Prime Video'] : []),
              ...(raw.filmin ? ['Filmin'] : []),
              ...(raw.movistar ? ['Movistar+'] : []),
            ],
            isEuskeraManual: raw.euskera_manual === true,
          };
        });
        setContents(data);
      } catch (err) {
        console.error(err);
        setError(t.errorLoading);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // igual que en ProfileClient: solo una vez

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => String(currentYear - i));

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      if (debouncedTitle) {
        if (!normalize(item.title).includes(normalize(debouncedTitle))) {
          return false;
        }
      }

      if (genreFilter) {
        const match = item.genres.some((g) =>
          normalize(g).includes(normalize(genreFilter))
        );
        if (!match) return false;
      }

      if (yearFilter && item.year !== yearFilter) return false;

      if (platformFilter && !item.platforms.includes(platformFilter))
        return false;

      if (onlyEuskera) {
        const hasEu = item.languages.some((lang) =>
          ['eu', 'eus', 'euskera'].includes(
            normalize(lang).split('(')[0].trim()
          )
        );
        if (!hasEu) return false;
      }

      if (onlyHighRating && item.rating < 8) return false;

      if (onlyEuskeraManual && !item.isEuskeraManual) return false;

      return true;
    });
  }, [
    contents,
    debouncedTitle,
    genreFilter,
    yearFilter,
    platformFilter,
    onlyEuskera,
    onlyHighRating,
    onlyEuskeraManual,
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e] px-4 py-6 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto max-w-6xl">
        {/* HEADER con selector de idioma, igual estilo que en perfil */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.title}
            </h1>
            <p className="text-sm text-gray-300 mt-1">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm text-gray-300">{t.languageLabel}:</span>
            <div className="inline-flex rounded-full bg-black/40 p-1">
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1 text-sm rounded-full ${
                  lang === 'es' ? 'bg-[#E63946] text-white' : 'text-gray-300'
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('eu')}
                className={`px-3 py-1 text-sm rounded-full ${
                  lang === 'eu' ? 'bg-[#E63946] text-white' : 'text-gray-300'
                }`}
              >
                EU
              </button>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-black/30 p-4 shadow-sm backdrop-blur">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Título */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                {t.labelTitle}
              </label>
              <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder={t.placeholderTitle}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-gray-100 outline-none ring-0 transition focus:border-[#E63946]"
                autoFocus
              />
            </div>

            {/* Género */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                {t.labelGenre}
              </label>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-gray-100 outline-none ring-0 transition focus:border-[#E63946]"
              >
                <option value="">{t.any}</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                {t.labelYear}
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-gray-100 outline-none ring-0 transition focus:border-[#E63946]"
              >
                <option value="">{t.any}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Plataforma */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-300">
                {t.labelPlatform}
              </label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-gray-100 outline-none ring-0 transition focus:border-[#E63946]"
              >
                <option value="">{t.any}</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={onlyEuskera}
                onChange={(e) => setOnlyEuskera(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#E63946] focus:ring-[#E63946]"
              />
              {t.onlyBasque}
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={onlyHighRating}
                onChange={(e) => setOnlyHighRating(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#E63946] focus:ring-[#E63946]"
              />
              {t.onlyHighRating}
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={onlyEuskeraManual}
                onChange={(e) => setOnlyEuskeraManual(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#E63946] focus:ring-[#E63946]"
              />
              {t.onlyManual}
            </label>
          </div>
        </section>

        {/* RESULTADOS */}
        {loading && (
          <p className="text-sm text-gray-300">{t.loading}</p>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <>
            <div className="mb-4 text-sm text-gray-300">
              {t.results(filteredContents.length)}
            </div>

            {filteredContents.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-gray-300">
                {t.noResults}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredContents.map((item) => (
                  <ContentCard key={item.id} {...item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
