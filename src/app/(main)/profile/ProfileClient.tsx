'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { auth, db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Trash2, Camera } from 'lucide-react';
import Image from 'next/image';
import ContentCard from '@/components/ContentCard';
import { useLists, UserList } from '../../hooks/useLists';

// -----------------------------
// Tipos
// -----------------------------
type ContentItem = {
  id: string;
  title: string;
  poster: string | null;
  type: 'movie' | 'serie';
  year?: string;
  rating?: number;
  genres: string[];
  languages: string[];
  platforms: string[];
  isEuskeraManual: boolean;
};

type CatalogDoc = {
  titulo?: string;
  title?: string;
  poster?: string;
  tipo?: 'movie' | 'serie';
  año?: number | string;
  rating?: number;
  generos?: string[];
  idiomas_disponibles?: string[];
  netflix?: boolean;
  etb?: boolean;
  disney?: boolean;
  prime?: boolean;
  filmin?: boolean;
  'apple tv'?: boolean;
  euskera_manual?: boolean;
};

export default function ProfileClient() {
  const user = auth.currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [favorites, setFavorites] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Idioma
  const [lang, setLang] = useState<'es' | 'eu'>('es');

  // Perfil
  const [displayName, setDisplayName] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string>('');
  const [avatarSrc, setAvatarSrc] = useState<string>('/avatar.png');

  const [savingProfile, setSavingProfile] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🔁 Listas personalizadas
  const {
    lists,
    loading: listsLoading,
    createList,
  } = useLists();

  // Traducciones
  const t = {
    title: lang === 'es' ? 'Perfil' : 'Profila',
    favorites: lang === 'es' ? 'Favoritos' : 'Gogokoak',
    stats: lang === 'es' ? 'Estadísticas' : 'Estatistikak',
    totalSaved: lang === 'es' ? 'Total guardados' : 'Guztira gordeta',
    totalEU: lang === 'es' ? 'Total en euskera' : 'Euskarazko guztira',
    recent: lang === 'es' ? 'Últimos vistos' : 'Azken ikusitakoak',
    comingSoon: lang === 'es' ? 'Próximamente' : 'Laster',
    languageLabel: lang === 'es' ? 'Idioma' : 'Hizkuntza',
    editProfile: lang === 'es' ? 'Editar perfil' : 'Profila editatu',
    nameLabel: lang === 'es' ? 'Nombre' : 'Izena',
    photoLabel: lang === 'es' ? 'Foto de perfil' : 'Profila argazkia',
    saveChanges: lang === 'es' ? 'Guardar cambios' : 'Aldaketak gorde',
    removing: lang === 'es' ? 'Eliminando...' : 'Ezabatzen...',
    removeFav: lang === 'es' ? 'Quitar de favoritos' : 'Gogokoetatik kendu',
    uploadPhoto: lang === 'es' ? 'Subir foto' : 'Kargatu argazkia',

    // Listas
    listsTitle: lang === 'es' ? 'Mis listas' : 'Nire zerrendak',
    listsSeeAll: lang === 'es' ? 'Ver todas' : 'Guztiak ikusi',
    listsCreate: lang === 'es' ? 'Crear lista' : 'Zerrenda sortu',
    listsEmpty:
      lang === 'es'
        ? 'Todavía no tienes listas. Crea tu primera lista para organizar qué ver.'
        : 'Oraindik ez duzu zerrendarik. Sortu lehen zerrenda zure edukiak antolatzeko.',
    listsLoading: lang === 'es' ? 'Cargando listas…' : 'Zerrendak kargatzen…',
    listsItems: (n: number) =>
      lang === 'es'
        ? `${n} elemento${n === 1 ? '' : 's'}`
        : `${n} elementu`,
  };

  // --------------------------------------
  // 🔥 CARGAR IDIOMA DESDE FIRESTORE
  // --------------------------------------
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const loadLanguage = async () => {
      try {
        const refUser = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(refUser);
        const data = snap.data() as any;

        const pref = data?.languagePreference;
        if (pref === 'es' || pref === 'eu') {
          setLang(pref);
        }
      } catch (err) {
        console.error('Error cargando idioma:', err);
      }
    };

    loadLanguage();
  }, []);

  // --------------------------------------
  // Inicializar datos de usuario
  // --------------------------------------
  useEffect(() => {
    if (user) {
      const initialPhoto = user.photoURL || '';
      setDisplayName(user.displayName || '');
      setPhotoURL(initialPhoto);
      setAvatarSrc(initialPhoto || '/avatar.png');
    }
  }, [user]);

  // --------------------------------------
  // Cargar favoritos
  // --------------------------------------
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const favRef = collection(db, 'users', user.uid, 'favorites');
      const favSnap = await getDocs(favRef);
      const favIds = favSnap.docs.map((d) => d.id);

      const contentDocs = await Promise.all(
        favIds.map((id) => getDoc(doc(db, 'catalogo', id)))
      );

      const items: ContentItem[] = contentDocs
        .filter((snap) => snap.exists())
        .map((snap) => {
          const data = snap.data() as CatalogDoc;
          return {
            id: snap.id,
            title: data.titulo || data.title || 'Sin título',
            poster: data.poster || null,
            type: (data.tipo as 'movie' | 'serie') || 'movie',
            year: data.año ? String(data.año) : undefined,
            rating: data.rating,
            genres: data.generos || [],
            languages: data.idiomas_disponibles || [],
            platforms: [
              data.netflix && 'netflix',
              data.etb && 'etb',
              data.disney && 'disney',
              data.prime && 'prime',
              data.filmin && 'filmin',
              data['apple tv'] && 'appletv',
            ].filter(Boolean) as string[],
            isEuskeraManual: data.euskera_manual === true,
          };
        });

      setFavorites(items);
    } catch (err) {
      console.error('Error loading favorites', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // --------------------------------------
  // Eliminar favorito
  // --------------------------------------
  const handleDeleteFavorite = async (id: string) => {
    if (!user) return;
    setRemovingId(id);

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'favorites', id));
      setFavorites((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setRemovingId(null);
    }
  };

  // --------------------------------------
  // SUBIDA DE FOTO
  // --------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const currentUser = auth.currentUser;

    if (!currentUser || !file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(ext)) {
      alert('Formato no soportado. Usa JPG, PNG, WEBP o GIF (no HEIC).');
      return;
    }

    setUploading(true);

    try {
      const path = `avatars/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(currentUser, { photoURL: downloadURL });

      setPhotoURL(downloadURL);
      setAvatarSrc(downloadURL);
    } catch (err) {
      alert('Error subiendo la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --------------------------------------
  // Guardar cambios
  // --------------------------------------
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    try {
      await updateProfile(user, {
        displayName: displayName || null,
        photoURL: photoURL || null,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // --------------------------------------
  // Crear lista rápida
  // --------------------------------------
  const handleCreateList = async () => {
    if (!user) return;
    const name =
      lang === 'es'
        ? window.prompt('Nombre de la lista:')
        : window.prompt('Zerrendaren izena:');
    if (!name) return;

    await createList(name.trim());
  };

  // --------------------------------------
  // Render
  // --------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin w-16 h-16 border-4 border-[#E63946] border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalEU = favorites.filter(
    (item) => item.isEuskeraManual || item.languages.includes('eu')
  ).length;

  // solo mostramos un adelanto de las 3 primeras listas
  const previewLists = lists.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e]">
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 pb-20 text-white">

        {/* ------------------------ HEADER PERFIL ------------------------ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={avatarSrc}
                width={90}
                height={90}
                className="rounded-full object-cover border-2 border-[#E63946]"
                alt="Avatar"
                unoptimized
                onError={() => setAvatarSrc('/avatar.png')}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#E63946] p-1 rounded-full"
              >
                <Camera size={16} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold">{displayName || 'Usuario'}</h1>
              <p className="text-gray-300 text-sm">{t.title}</p>
            </div>
          </div>

          {/* Idioma */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">{t.languageLabel}:</span>
            <div className="inline-flex rounded-full bg-black/40 p-1">
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1 rounded-full ${
                  lang === 'es'
                    ? 'bg-[#E63946] text-white'
                    : 'text-gray-300'
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('eu')}
                className={`px-3 py-1 rounded-full ${
                  lang === 'eu'
                    ? 'bg-[#E63946] text-white'
                    : 'text-gray-300'
                }`}
              >
                EU
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------ EDITAR PERFIL ------------------------ */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t.editProfile}</h2>

          <div className="bg-black/30 p-4 rounded-xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm">{t.nameLabel}</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-black/40 border border-white/20 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm">{t.photoLabel}</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-black/40 border border-white/20 rounded-lg px-3 py-2"
              >
                <Camera size={16} /> {uploading ? 'Subiendo...' : t.uploadPhoto}
              </button>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-4 py-2 bg-[#E63946] rounded-lg"
              >
                {savingProfile ? 'Guardando...' : t.saveChanges}
              </button>
            </div>
          </div>
        </section>

        {/* ------------------------ ESTADÍSTICAS ------------------------ */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t.stats}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 p-4 rounded-xl border border-white/10">
              <p className="text-sm text-gray-300">{t.totalSaved}</p>
              <p className="text-2xl font-bold">{favorites.length}</p>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/10">
              <p className="text-sm text-gray-300">{t.totalEU}</p>
              <p className="text-2xl font-bold">{totalEU}</p>
            </div>
          </div>
        </section>

        {/* ------------------------ MIS LISTAS ------------------------ */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">{t.listsTitle}</h2>
            <div className="flex gap-2">
              <Link
                href="/profile/lists"
                className="px-3 py-1.5 text-xs rounded-full border border-white/20 bg-black/40 hover:bg-black/60"
              >
                {t.listsSeeAll}
              </Link>
              <button
                onClick={handleCreateList}
                className="px-3 py-1.5 text-xs rounded-full bg-[#E63946] hover:bg-[#f05252]"
              >
                {t.listsCreate}
              </button>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-white/10">
            {listsLoading ? (
              <p className="text-sm text-gray-300">{t.listsLoading}</p>
            ) : lists.length === 0 ? (
              <p className="text-sm text-gray-300">{t.listsEmpty}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {previewLists.map((list: UserList) => (
                  <Link
                    key={list.id}
                    href={`/profile/lists/${list.id}`}
                    className="p-3 rounded-lg bg-black/40 border border-white/15 hover:bg-black/60 transition"
                  >
                    <p className="font-medium text-sm truncate">
                      {list.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t.listsItems(list.items.length)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ------------------------ FAVORITOS ------------------------ */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">{t.favorites}</h2>

          {favorites.length === 0 ? (
            <p className="text-gray-300">
              {lang === 'es'
                ? 'No tienes favoritos aún.'
                : 'Oraindik ez dituzu gogokoak.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 bg-black/30 rounded-xl p-2 border border-white/10"
                >
                  <ContentCard {...item} />
                  <button
                    onClick={() => handleDeleteFavorite(item.id)}
                    disabled={removingId === item.id}
                    className="flex items-center justify-center gap-2 text-xs text-red-400 py-1 rounded-md bg-red-500/10"
                  >
                    <Trash2 size={14} />
                    {removingId === item.id ? t.removing : t.removeFav}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ------------------------ ÚLTIMOS VISTOS ------------------------ */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t.recent}</h2>
          <div className="bg-black/30 p-6 rounded-xl border border-dashed border-white/20 text-gray-300">
            {t.comingSoon}
          </div>
        </section>
      </main>
    </div>
  );
}
