// src/app/(main)/page.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import ContentCard from '@/components/ContentCard';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ContentItem = {
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

type Language = 'es' | 'eu';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Igual que en Profile: estado local de idioma
  const [lang, setLang] = useState<Language>('es');

  const [enEuskera, setEnEuskera] = useState<ContentItem[]>([]);
  const [tendencia, setTendencia] = useState<ContentItem[]>([]);
  const [nuevas, setNuevas] = useState<ContentItem[]>([]);
  const [netflix, setNetflix] = useState<ContentItem[]>([]);
  const [etb, setEtb] = useState<ContentItem[]>([]);

  // Traducciones de secciones, mismo patrón que en Profile
  const t = {
    sectionEuskera: lang === 'es' ? 'Ahora en euskera' : 'Orain euskaraz',
    sectionTrend: lang === 'es' ? 'Lo más top ahora' : 'Orain modan daudenak',
    sectionNew: lang === 'es' ? 'Últimos estrenos' : 'Azken estreinaldiak',
    sectionNetflix:
      lang === 'es' ? 'En euskera en Netflix' : 'Netflix-en euskaraz',
    sectionETB:
      lang === 'es' ? 'Disponible en ETB' : 'ETB-n ikusgai',
  };

  // --------------------------------------------------
  // Auth + carga de catálogo + idioma usuario
  // --------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      await Promise.all([
        loadAllContent(),
        loadLanguagePreference(currentUser.uid),
      ]);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // --------------------------------------------------
  // Cargar idioma desde Firestore (igual que Profile)
  // users / <uid> / languagePreference
  // --------------------------------------------------
  const loadLanguagePreference = async (uid: string) => {
    try {
      const refUser = doc(db, 'users', uid);
      const snap = await getDoc(refUser);
      const data = snap.data() as any;

      const pref = data?.languagePreference;
      if (pref === 'es' || pref === 'eu') {
        setLang(pref);
      }
    } catch (err) {
      console.error('Error cargando idioma en Home:', err);
    }
  };

  // --------------------------------------------------
  // Cargar catálogo
  // --------------------------------------------------
  const loadAllContent = async () => {
    const snapshot = await getDocs(collection(db, 'catalogo'));

    const all: ContentItem[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ContentItem, 'id'>),
    }));

    // 1) Contenido en euskera (marcado o idioma 'eu')
    setEnEuskera(
      all
        .filter(
          (c) =>
            c.idiomas_disponibles?.includes('eu') || c.euskera_manual === true
        )
        .slice(0, 15)
    );

    // 2) Tendencia: rating alto
    setTendencia(
      all
        .filter((c) => (c.rating ?? 0) >= 8)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 15)
    );

    // 3) Nuevas: últimos años
    setNuevas(
      all
        .filter((c) => (c.año ?? 0) >= 2023)
        .sort((a, b) => (b.año ?? 0) - (a.año ?? 0))
        .slice(0, 15)
    );

    // 4) Plataformas
    setNetflix(all.filter((c) => c.netflix).slice(0, 15));
    setEtb(all.filter((c) => c.etb).slice(0, 15));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin w-16 h-16 border-4 border-[#E63946] border-t-transparent rounded-full" />
      </div>
    );

  // --------------------------------------------------
  // Carrusel reutilizable
  // --------------------------------------------------
  const CarouselSection = ({
    title,
    items,
    icon,
  }: {
    title: string;
    items: ContentItem[];
    icon?: ReactNode;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          {icon && <span className="w-8 h-8 flex items-center justify-center">{icon}</span>}
          <h2 className="text-3xl font-bold font-barriecito tracking-wider text-white drop-shadow-lg">
            {title}
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          <div className="flex gap-3 sm:gap-4 md:gap-6 min-w-max">
            {items.map((item) => (
              <div key={item.id} className="w-28 sm:w-36 md:w-48 flex-shrink-0">
                <ContentCard
                  id={item.id}
                  title={item.titulo || item.title || ''}
                  poster={item.poster ?? null}
                  type={item.tipo as 'movie' | 'serie'}
                  year={item.año ? String(item.año) : undefined}
                  rating={item.rating}
                  genres={item.generos || []}
                  languages={item.idiomas_disponibles || []}
                  platforms={[
                    item.netflix && 'netflix',
                    item.etb && 'etb',
                    item.disney && 'disney',
                    item.prime && 'prime',
                    item.filmin && 'filmin',
                    item['apple tv'] && 'appletv',
                  ].filter(Boolean) as string[]}
                  isEuskeraManual={item.euskera_manual}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e]">
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 pb-20">
        {/* Nada de botón de idioma aquí, solo usamos lang ya cargado */}

        {/* Euskaraz */}
        <CarouselSection
          title={t.sectionEuskera}
          items={enEuskera}
          icon={
            <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                className="object-contain"
              >
                <rect width="24" height="24" rx="6" fill="#0F8F3F" />
                <line
                  x1="4"
                  y1="12"
                  x2="20"
                  y2="12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="12"
                  y1="4"
                  x2="12"
                  y2="20"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                  stroke="#D62828"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                  stroke="#D62828"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
          }
        />

        {/* Tendencia */}
        <CarouselSection
          title={t.sectionTrend}
          items={tendencia}
          icon={
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="object-contain"
            >
              <rect width="24" height="24" rx="6" fill="#1A1A2E" />
              <path
                d="M5 16L11 10L14.5 13.5L19 8"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.5 8H19V12.5"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />

        {/* Nuevos */}
        <CarouselSection
          title={t.sectionNew}
          items={nuevas}
          icon={
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="object-contain"
            >
              <rect width="24" height="24" rx="6" fill="#1A1A2E" />
              <path
                d="M12 4L13.8 9H19L14.9 12.2L16.7 17L12 14L7.3 17L9.1 12.2L5 9H10.2L12 4Z"
                fill="#FACC15"
                stroke="#EAB308"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          }
        />

        {/* Netflix con logo local */}
        <CarouselSection
          title={t.sectionNetflix}
          items={netflix}
          icon={
            <Image
              src="/iconos/Netflix_logo.png"
              alt="Netflix"
              width={32}
              height={32}
              className="object-contain"
            />
          }
        />

        {/* ETB con logo local */}
        <CarouselSection
          title={t.sectionETB}
          items={etb}
          icon={
            <Image
              src="/iconos/etb_logo.png"
              alt="ETB"
              width={32}
              height={32}
              className="object-contain"
            />
          }
        />
      </main>
    </div>
  );
}
