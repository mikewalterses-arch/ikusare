// src/app/content/[id]/ContentDetailClient.tsx
"use client";

import { useEffect, useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, ArrowLeft, BookmarkPlus, Eye, Star } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useFavorites } from "../../../hooks/useFavorites";
import { useLists, UserList } from "../../../hooks/useLists";

type ContentDetailClientProps = {
  id: string;
};

type Movie = {
  id: string;
  titulo?: string;
  title?: string;
  poster?: string;
  tipo?: "movie" | "serie";
  año?: number;
  rating?: number;
  generos?: string[];
  idiomas_disponibles?: string[];
  netflix?: boolean;
  etb?: boolean;
  disney?: boolean;
  prime?: boolean;
  filmin?: boolean;
  "apple tv"?: boolean;
  sinopsis?: string;
  euskera_manual?: boolean;
  [key: string]: any;
};

type Language = "es" | "eu";

const translations = {
  back: { es: "Volver", eu: "Atzera" },
  notFound: {
    es: "No se ha encontrado este contenido.",
    eu: "Ezin izan da edukia aurkitu.",
  },
  cannotLoad: {
    es: "No se ha podido cargar este contenido.",
    eu: "Ezin izan da edukia kargatu.",
  },
  mustLoginFavorites: {
    es: "Debes iniciar sesión para guardar favoritos.",
    eu: "Saioa hasi behar duzu gogokoak gordetzeko.",
  },
  markedWatched: {
    es: "Marcado como vista (placeholder). Más adelante añadiremos el historial.",
    eu: "Ikusita gisa markatuta (placeholder). Geroago gehituko dugu historia.",
  },
  saved: { es: "Guardada", eu: "Gordeta" },
  saveToFavorites: {
    es: "Guardar en favoritos",
    eu: "Gogokoetan gorde",
  },
  lists: { es: "Listas", eu: "Zerrendak" },
  watched: { es: "Vista", eu: "Ikusita" },
  genres: { es: "Géneros", eu: "Generoak" },
  synopsis: { es: "Sinopsis", eu: "Sinopsia" },
  similarRecommendations: {
    es: "Recomendaciones similares",
    eu: "Antzeko gomendioak",
  },
  similarSubtitle: {
    es: "Próximamente: recomendaciones reales según catálogo.",
    eu: "Laster: datu errealetan oinarritutako gomendioak.",
  },
  languagesLabel: {
    es: "Idiomas",
    eu: "Hizkuntzak",
  },
  movieType: { es: "Película", eu: "Film" },
  seriesType: { es: "Serie", eu: "Telesaila" },
  euskeraBadge: { es: "Euskera", eu: "Euskaraz" },
  noPoster: { es: "Sin póster", eu: "Posterik gabe" },

  // Textos modal listas
  listsModalTitle: {
    es: "Guardar en una lista",
    eu: "Zerrenda batean gorde",
  },
  listsChooseExisting: {
    es: "Elige una lista existente:",
    eu: "Aukeratu lehendik dagoen zerrenda:",
  },
  listsNoListsYet: {
    es: "Todavía no tienes listas. Crea una nueva abajo.",
    eu: "Oraindik ez duzu zerrendarik. Sortu bat behean.",
  },
  listsLoading: {
    es: "Cargando listas…",
    eu: "Zerrendak kargatzen…",
  },
  listsCreateNew: {
    es: "O crea una lista nueva:",
    eu: "Edo sortu zerrenda berri bat:",
  },
  listsNamePlaceholder: {
    es: "Nombre de la lista (ej. Para ver en familia)",
    eu: "Zerrendaren izena (adib. Familian ikusteko)",
  },
  listsCreateAndAdd: {
    es: "Crear y añadir",
    eu: "Sortu eta gehitu",
  },
  close: {
    es: "Cerrar",
    eu: "Itxi",
  },
};

export default function ContentDetailClient({ id }: ContentDetailClientProps) {
  const router = useRouter();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState<Language>("es");

  // Favoritos
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();

  // Listas
  const {
    lists,
    loading: listsLoading,
    createList,
    addToList,
  } = useLists();

  // Modal de listas
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [savingNewList, setSavingNewList] = useState(false);

  // Helper de traducción
  const t = (key: keyof typeof translations) => translations[key][language];

  // Cargar idioma desde Firestore (como en tu código original)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLanguage("es");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const data = snap.data() as any | undefined;
        const lang = data?.languagePreference as Language | undefined;

        if (lang === "es" || lang === "eu") {
          setLanguage(lang);
        } else {
          setLanguage("es");
        }
      } catch (err) {
        console.error("Error cargando idioma de usuario:", err);
        setLanguage("es");
      }
    });

    return () => unsubscribe();
  }, []);

  // ¿Es favorito este id?
  const isFav = useMemo(
    () => (isFavorite ? isFavorite(id) : false),
    [id, isFavorite]
  );

  // Cargar datos de la película
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const ref = doc(db, "catalogo", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setMovie(null);
          return;
        }

        const data = snap.data() as Omit<Movie, "id">;
        const movieData: Movie = { id, ...data };
        setMovie(movieData);
      } catch (err) {
        console.error("Error cargando contenido:", err);
        setError(t("cannotLoad"));
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const platforms = useMemo(() => {
    if (!movie) return [] as string[];
    return [
      movie.netflix && "netflix",
      movie.etb && "etb",
      movie.disney && "disney",
      movie.prime && "prime",
      movie.filmin && "filmin",
      movie["apple tv"] && "appletv",
    ].filter(Boolean) as string[];
  }, [movie]);

  const isEuskeraManual = !!movie?.euskera_manual;

  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "etb":
        return "ETB";
      case "netflix":
        return "N";
      case "max":
      case "hbomax":
        return "MAX";
      case "disney":
      case "disney+":
        return "D+";
      case "prime":
      case "primevideo":
        return "Prime";
      case "filmin":
        return "Filmin";
      case "appletv":
      case "apple tv+":
        return "TV+";
      case "movistar":
        return "M+";
      default:
        return platform.toUpperCase().slice(0, 4);
    }
  };

  const handleToggleFavorite = () => {
    const user = auth.currentUser;
    if (!user) {
      alert(t("mustLoginFavorites"));
      return;
    }
    if (!movie) return;

    toggleFavorite({
      id: movie.id,
      title: movie.titulo || movie.title || "",
      poster: movie.poster || "",
      year: movie.año,
      euskera_manual: !!movie.euskera_manual,
    });
  };

  // Listas: añadir a lista existente
  const handleAddToExistingList = async (listId: string) => {
    if (!movie) return;
    await addToList(listId, movie.id);
    setShowListModal(false);
  };

  // Listas: crear y añadir
  const handleCreateAndAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!movie) return;
    if (!newListName.trim()) return;

    setSavingNewList(true);
    const newId = await createList(newListName.trim());
    await addToList(newId, movie.id);
    setSavingNewList(false);
    setNewListName("");
    setShowListModal(false);
  };

  const handleMarkWatched = () => {
    alert(t("markedWatched"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <div className="animate-spin w-12 h-12 border-4 border-[#E63946] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="text-white px-6 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("back")}</span>
        </button>
        <p className="text-sm text-gray-200">{error ?? t("notFound")}</p>
      </div>
    );
  }

  const displayTitle = movie.titulo || movie.title || "";
  const metaLine = [
    movie.año,
    movie.generos && movie.generos.length > 0
      ? movie.generos.join(" · ")
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <div className="relative w-full">
        <div className="absolute inset-0 -z-10">
          {movie.poster ? (
            <>
              <div
                className="h-full w-full bg-cover bg-center blur-sm scale-105"
                style={{ backgroundImage: `url(${movie.poster})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/40" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-800" />
          )}
        </div>

        <div className="mx-auto max-w-6xl flex flex-col md:flex-row gap-6 px-4 py-6 md:px-6 md:py-10">
          {/* Poster + volver */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="mb-1 inline-flex items-center gap-2 text-xs text-slate-200/80 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("back")}</span>
            </button>

            <div className="relative h-60 w-40 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-gray-900 shadow-2xl md:h-72 md:w-48">
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  {t("noPoster")}
                </div>
              )}

              {isEuskeraManual && (
                <div className="absolute top-3 left-3 bg-[#E63946] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                  {t("euskeraBadge")}
                </div>
              )}

              {movie.tipo && (
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-[11px] px-3 py-1 rounded-full">
                  {movie.tipo === "movie" ? t("movieType") : t("seriesType")}
                </div>
              )}

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
          <div className="flex flex-1 flex-col justify-end gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {displayTitle}
              </h1>
              {metaLine && (
                <p className="mt-2 text-xs md:text-sm text-slate-200">
                  {metaLine}
                </p>
              )}

              {movie.idiomas_disponibles &&
                movie.idiomas_disponibles.length > 0 && (
                  <p className="mt-2 text-[11px] md:text-xs text-slate-300 bg-white/10 px-2 py-1 inline-flex rounded-full border border-white/20">
                    {t("languagesLabel")}:{" "}
                    <span className="ml-1">
                      {movie.idiomas_disponibles.join(", ")}
                    </span>
                  </p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
              {typeof movie.rating === "number" && (
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/80">
                  <Star className="h-4 w-4 fill-yellow-400/80 text-yellow-300" />
                  <span className="font-semibold">
                    {movie.rating.toFixed(1)}
                  </span>
                  <span className="text-slate-300 text-[11px]">/ 10</span>
                </div>
              )}

              {platforms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {platforms.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-[11px] border border-slate-700/80"
                    >
                      {getPlatformLabel(p)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isFav
                    ? "bg-[#E63946] border border-[#E63946] text-white"
                    : "bg-slate-50 text-slate-900 border border-slate-50 hover:bg-slate-200"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFav ? "fill-white" : "fill-transparent"
                  }`}
                />
                <span>{isFav ? t("saved") : t("saveToFavorites")}</span>
              </button>

              <button
                onClick={() => setShowListModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 border border-slate-700 hover:bg-slate-800 transition"
              >
                <BookmarkPlus className="h-4 w-4" />
                <span>{t("lists")}</span>
              </button>

              <button
                onClick={handleMarkWatched}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 border border-slate-700 hover:bg-slate-800 transition"
              >
                <Eye className="h-4 w-4" />
                <span>{t("watched")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO INFERIOR */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 space-y-8">
        {movie.generos && movie.generos.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-base md:text-lg font-semibold">
              {t("genres")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {movie.generos.map((g) => (
                <span
                  key={g}
                  className="text-xs bg-white/5 text-gray-100 px-3 py-1 rounded-full border border-white/10"
                >
                  {g}
                </span>
              ))}
            </div>
          </section>
        )}

        {movie.sinopsis && (
          <section className="space-y-2">
            <h2 className="text-base md:text-lg font-semibold">
              {t("synopsis")}
            </h2>
            <p className="text-sm md:text-[15px] leading-relaxed text-slate-200">
              {movie.sinopsis}
            </p>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold">
              {t("similarRecommendations")}
            </h2>
            <span className="text-[11px] text-slate-400">
              {t("similarSubtitle")}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="group rounded-xl border border-slate-800 bg-slate-900/70 p-2 flex flex-col gap-2 hover:border-slate-600 hover:bg-slate-900 transition"
              >
                <div className="aspect-[2/3] w-full rounded-lg bg-slate-800/80" />
                <div className="h-2 w-20 rounded-full bg-slate-700/60" />
                <div className="h-2 w-12 rounded-full bg-slate-800/80" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* MODAL LISTAS */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {t("listsModalTitle")}
              </h3>
              <button
                onClick={() => setShowListModal(false)}
                className="text-gray-400 hover:text-gray-200 text-sm"
              >
                {t("close")}
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                {t("listsChooseExisting")}
              </p>
              {listsLoading ? (
                <p className="text-gray-400 text-sm">
                  {t("listsLoading")}
                </p>
              ) : lists.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  {t("listsNoListsYet")}
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleAddToExistingList(list.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left text-sm"
                    >
                      <span>{list.name}</span>
                      <span className="text-xs text-gray-400">
                        {list.items.length} elementos
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-700 pt-4 mt-2">
              <p className="text-sm text-gray-300 mb-2">
                {t("listsCreateNew")}
              </p>
              <form onSubmit={handleCreateAndAdd} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder={t("listsNamePlaceholder")}
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={savingNewList}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium disabled:opacity-60"
                >
                  {savingNewList ? "..." : t("listsCreateAndAdd")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
