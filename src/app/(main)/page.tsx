// src/app/(main)/page.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import ContentCard from '@/components/ContentCard';
import { useRouter } from 'next/navigation';

// Tipo para los ítems del catálogo
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
  [key: string]: any;
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Datos separados por secciones
  const [enEuskera, setEnEuskera] = useState<ContentItem[]>([]);
  const [tendencia, setTendencia] = useState<ContentItem[]>([]);
  const [nuevas, setNuevas] = useState<ContentItem[]>([]);
  const [netflix, setNetflix] = useState<ContentItem[]>([]);
  const [etb, setEtb] = useState<ContentItem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        loadAllContent();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadAllContent = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'catalogo'));

      const all: ContentItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ContentItem, 'id'>),
      }));

      setEnEuskera(
        all.filter((c) => c.idiomas_disponibles?.includes('eu')).slice(0, 15),
      );

      setTendencia(
        all
          .filter((c) => (c.rating ?? 0) >= 8)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 15),
      );

      setNuevas(
        all
          .filter((c) => (c.año ?? 0) >= 2023)
          .sort((a, b) => (b.año ?? 0) - (a.año ?? 0))
          .slice(0, 15),
      );

      setNetflix(all.filter((c) => c.netflix).slice(0, 15));
      setEtb(all.filter((c) => c.etb).slice(0, 15));
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin w-16 h-16 border-4 border-[#E63946] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Componente de carrusel horizontal
  const CarouselSection = ({
    title,
    items,
    icon,
  }: {
    title: string;
    items: ContentItem[];
    icon?: ReactNode;
  }) => (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        {icon && <span className="text-4xl">{icon}</span>}
        <h2 className="text-3xl font-bold font-barriecito tracking-wider text-white drop-shadow-lg">
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
        <div className="flex gap-3 sm:gap-4 md:gap-6 min-w-max">
          {items.map((item) => (
            <div
              key={item.id}
              className="w-28 sm:w-36 md:w-48 flex-shrink-0"
            >
            <ContentCard
              id={item.id}
              title={item.titulo || item.title || ''}
              poster={item.poster ?? null}
              type={item.tipo as 'movie' | 'serie'}
              year={item.año !== undefined ? String(item.año) : undefined}
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
              synopsis={item.sinopsis || ''}
              isEuskeraManual={item.euskera_manual}   // 👈 nuevo
            />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e]">
      {/* Fondo sutil vasco */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-[#E63946]/20 via-transparent to-[#E63946]/20" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 pb-20">
        {/* Bienvenida */}
        <div className="mb-16 text-center">
          <p className="mt-4 text-xl text-gray-300">
            Gaurko gomendioak zure gustuetarako prestatuta
          </p>
        </div>

        {/* Carruseles */}
        {enEuskera.length > 0 && (
          <CarouselSection title="Euskaraz ikusgai" items={enEuskera} />
        )}

        {tendencia.length > 0 && (
          <CarouselSection
            title="Tendencia orain"
            items={tendencia}
            icon="🔥"
          />
        )}

        {nuevas.length > 0 && (
          <CarouselSection
            title="Berri-berriak"
            items={nuevas}
            icon="🆕"
          />
        )}

        {netflix.length > 0 && (
          <CarouselSection
            title="Netflix-en euskaraz"
            items={netflix}
            icon="N"
          />
        )}

        {etb.length > 0 && (
          <CarouselSection
            title="ETB-n ikusgai"
            items={etb}
            icon="📺"
          />
        )}

        {/* Mensaje final */}
        <div className="text-center py-16">
          <p className="text-2xl text-gray-400 font-barriecito">
            Zure hurrengo filma hemen dago...
          </p>
        </div>
      </main>
    </div>
  );
}
