// src/app/(main)/content/[id]/ContentDetailClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, HeartOff, Bookmark, BookmarkCheck, Star, Globe2 } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type ContentItem = {
  id: string;
  titulo?: string;
  title?: string;
  poster?: string;
  tipo?: "movie" | "serie";
  año?: number | string;
  rating?: number;
  generos?: string[];
  idiomas_disponibles?: string[];
  sinopsis?: string;
  netflix?: boolean;
  etb?: boolean;
  disney?: boolean;
  prime?: boolean;
  filmin?: boolean;
  "apple tv"?: boolean;
  euskera_manual?: boolean;
  [key: string]: any;
};

type Props = {
  id: string;
};

export default function ContentDetailClient({ id }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [stateLoading, setStateLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  // 1) Escuchar auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // 2) Cargar datos de la película
  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, "catalogo", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Película no encontrada");
        } else {
          setContent({ id, ...(snap.data() as Omit<ContentItem, "id">) });
        }
      } catch (err: any) {
        console.error("[ContentDetail] Error cargando contenido:", err);
        setError("Error cargando la película");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // 3) Cargar estado de like/guardado del usuario
  useEffect(() => {
    const loadUserState = async () => {
      if (!user) {
        setStateLoading(false);
        return;
      }

      try {
        const ref = doc(db, "userLibrary", `${user.uid}_${id}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as { liked?: boolean; saved?: boolean };
          setLiked(!!data.liked);
          setSaved(!!data.saved);
        }
      } catch (err) {
        console.error("[ContentDetail] Error cargando estado de usuario:", err);
      } finally {
        setStateLoading(false);
      }
    };

    loadUserState();
  }, [user, id]);

  const ensureLoggedIn = () => {
    if (!user) {
      router.push("/login");
      return false;
    }
    return true;
  };

  const toggleLike = async () => {
    if (!ensureLoggedIn()) return;
    const newLiked = !liked;
    setLiked(newLiked);

    try {
      const ref = doc(db, "userLibrary", `${user!.uid}_${id}`);
      await setDoc(
        ref,
        {
          userId: user!.uid,
          contentId: id,
          liked: newLiked,
          saved,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("[ContentDetail] Error guardando like:", err);
    }
  };

  const toggleSaved = async () => {
    if (!ensureLoggedIn()) return;
    const newSaved = !saved;
    setSaved(newSaved);

    try {
      const ref = doc(db, "userLibrary", `${user!.uid}_${id}`);
      await setDoc(
        ref,
        {
          userId: user!.uid,
          contentId: id,
          saved: newSaved,
          liked,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("[ContentDetail] Error guardando en lista:", err);
    }
  };

  if (loading || !content) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center text-red-400">
          {error}
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando película...
      </div>
    );
  }

  const title = content.titulo || content.title || "Sin título";
  const year = content.año ? String(content.año) : "—";
  const rating = content.rating;
  const genres = content.generos || [];
  const synopsis = content.sinopsis || "Sin sinopsis disponible.";
  const languages = content.idiomas_disponibles || [];
  const isEuskeraManual = !!content.euskera_manual;
  const hasEuskera = isEuskeraManual || languages.includes("eu");

  const platforms: string[] = [
    content.netflix && "Netflix",
    content.etb && "ETB",
    content.disney && "Disney+",
    content.prime && "Prime Video",
    content.filmin && "Filmin",
    content["apple tv"] && "Apple TV+",
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e]">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Tarjeta grande tipo hero */}
        <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row gap-8 p-4 sm:p-6 lg:p-8">
          {/* Poster */}
          <div className="w-full md:w-1/3 lg:w-1/3 flex-shrink-0">
            <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-xl bg-gray-900">
              {content.poster ? (
                <Image
                  src={content.poster}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 60vw, (max-width: 1200px) 30vw, 25vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  Sin póster
                </div>
              )}

              {hasEuskera && (
                <div className="absolute top-3 left-3 bg-[#E63946] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                  Euskera {isEuskeraManual ? "✔" : "(API)"}
                </div>
              )}
            </div>
          </div>

          {/* Info principal */}
          <div className="flex-1 flex flex-col gap-4 sm:gap-5 lg:gap-6">
            {/* Título + acciones */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2">
                  {title}
                </h1>
                <p className="text-sm sm:text-base text-gray-300">
                  {content.tipo === "serie" ? "Serie" : "Película"} · {year}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* LIKE */}
                <button
                  onClick={toggleLike}
                  className="p-2 sm:p-3 rounded-full border border-white/15 bg-black/40 hover:bg-black/70 transition flex items-center justify-center"
                  aria-label="Marcar como me gusta"
                >
                  {liked ? (
                    <Heart className="w-5 h-5 text-[#E63946] fill-[#E63946]" />
                  ) : (
                    <HeartOff className="w-5 h-5 text-gray-300" />
                  )}
                </button>

                {/* GUARDAR */}
                <button
                  onClick={toggleSaved}
                  className="p-2 sm:p-3 rounded-full border border-white/15 bg-black/40 hover:bg-black/70 transition flex items-center justify-center"
                  aria-label="Guardar en mi lista"
                >
                  {saved ? (
                    <BookmarkCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Bookmark className="w-5 h-5 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-200">
              {typeof rating === "number" && (
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-300 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </div>
              )}

              <span className="text-gray-400">Año: {year}</span>

              {languages.length > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                  <Globe2 className="w-4 h-4 text-cyan-300" />
                  <span className="text-xs sm:text-sm">
                    Idiomas: {languages.join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Géneros */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs sm:text-sm bg-white/10 text-gray-100 px-3 py-1 rounded-full border border-white/10"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Sinopsis */}
            <div className="mt-2">
              <h2 className="text-sm font-semibold text-gray-200 mb-1">
                Sinopsis
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {synopsis}
              </p>
            </div>

            {/* Plataformas */}
            {platforms.length > 0 && (
              <div className="mt-2">
                <h2 className="text-sm font-semibold text-gray-200 mb-2">
                  Disponible en
                </h2>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs sm:text-sm text-gray-100"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Estado de usuario (texto pequeño) */}
            {!stateLoading && user && (
              <div className="mt-auto pt-2 text-xs text-gray-400">
                {liked && saved && "💖 En tu lista y marcada como favorita."}
                {liked && !saved && "💖 Marcada como favorita."}
                {!liked && saved && "📁 Guardada en tu lista."}
                {!liked && !saved && "Añádela a tu lista o márcala como favorita."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
