"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut, type User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";

type Language = "eu" | "es";

const translations = {
  profile: { eu: "Profila", es: "Perfil" },
  settings: { eu: "Ezarpenak", es: "Ajustes" },
  signOut: { eu: "Irten", es: "Cerrar sesión" },
};

type UserProfile = {
  username: string;
  avatarUrl: string;
  followers: number;
  following: number;
};

export default function Header({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [language, setLanguage] = useState<Language>("es");
  const [loadingLang, setLoadingLang] = useState(true);
  const [savingLang, setSavingLang] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    avatarUrl: "/images/default-avatar.svg",
    followers: 0,
    following: 0,
  });

  // 🔹 Cargar datos de usuario + idioma desde Firestore (y escuchar cambios)
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(
      async (firebaseUser: FirebaseUser | null) => {
        if (!firebaseUser) {
          // Sin usuario: estado por defecto
          setLanguage("es");
          setProfile({
            username: "Invitado",
            avatarUrl: "/images/default-avatar.svg",
            followers: 0,
            following: 0,
          });
          setLoadingLang(false);

          if (unsubscribeDoc) {
            unsubscribeDoc();
            unsubscribeDoc = null;
          }
          return;
        }

        try {
          const ref = doc(db, "users", firebaseUser.uid);

          // Primer getDoc para estado inicial rápido
          const snap = await getDoc(ref);
          const data = snap.data() as any | undefined;

          // Idioma
          const pref = data?.languagePreference as Language | undefined;
          if (pref === "eu" || pref === "es") {
            setLanguage(pref);
          } else {
            setLanguage("es");
          }

          // Perfil inicial
          const usernameFromDb: string | undefined = data?.username;
          const profilePictureFromDb: string | undefined = data?.profilepicture;

          const username =
            usernameFromDb ||
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Usuario";

          const avatarUrl =
            profilePictureFromDb ||
            firebaseUser.photoURL ||
            "/images/default-avatar.svg";

          const followers =
            typeof data?.followers === "number" ? data.followers : 0;
          const following =
            typeof data?.following === "number" ? data.following : 0;

          setProfile({
            username,
            avatarUrl,
            followers,
            following,
          });

          // 🔁 Suscripción en tiempo real al doc de usuario
          if (unsubscribeDoc) {
            unsubscribeDoc();
          }
          unsubscribeDoc = onSnapshot(
            ref,
            (docSnap) => {
              const liveData = docSnap.data() as any | undefined;
              if (!liveData) return;

              const livePref = liveData?.languagePreference as
                | Language
                | undefined;
              if (livePref === "eu" || livePref === "es") {
                setLanguage(livePref);
              }

              const liveUsername: string | undefined = liveData?.username;
              const liveProfilePic: string | undefined =
                liveData?.profilepicture;

              const newUsername =
                liveUsername ||
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "Usuario";

              const newAvatarUrl =
                liveProfilePic ||
                firebaseUser.photoURL ||
                "/images/default-avatar.svg";

              const liveFollowers =
                typeof liveData?.followers === "number"
                  ? liveData.followers
                  : 0;
              const liveFollowing =
                typeof liveData?.following === "number"
                  ? liveData.following
                  : 0;

              setProfile({
                username: newUsername,
                avatarUrl: newAvatarUrl,
                followers: liveFollowers,
                following: liveFollowing,
              });
            },
            (err) => {
              console.error("Error en onSnapshot de usuario:", err);
            }
          );
        } catch (err) {
          console.error("Error leyendo datos de usuario:", err);
          setLanguage("es");
          setProfile({
            username: "Usuario",
            avatarUrl: "/images/default-avatar.svg",
            followers: 0,
            following: 0,
          });
        } finally {
          setLoadingLang(false);
        }
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  // 🔹 Cambiar idioma (actualiza Firebase + recarga UI)
  const changeLanguage = async (newLang: Language) => {
    const user = auth.currentUser;
    if (!user) return;
    if (savingLang) return;
    if (newLang === language) return;

    try {
      setSavingLang(true);
      setLanguage(newLang); // feedback inmediato

      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        languagePreference: newLang,
      });

      window.location.reload();
    } catch (err) {
      console.error("Error actualizando languagePreference:", err);
    } finally {
      setSavingLang(false);
    }
  };

  const t = {
    profile: translations.profile[language],
    settings: translations.settings[language],
    signOut: translations.signOut[language],
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="bg-[#1D3557] text-white py-5 px-4 sm:px-6 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl bg-opacity-95">
      <div className="w-full flex items-center justify-between">
        {/* Hamburger (solo móvil) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-white mr-3 p-2 rounded-lg hover:bg-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>

        {/* Logo */}
        <div
          onClick={() => router.push("/")}
          className="cursor-pointer flex items-center gap-3 group"
        >
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wider transition group-hover:text-[#E63946] drop-shadow-md"
            style={{ fontFamily: "'Barriecito', cursive" }}
          >
            IkuSare
          </h1>
        </div>

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 hover:bg-white/10 rounded-2xl px-3 sm:px-4 py-2 transition-all duration-300"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-3 ring-[#E63946]/40 shadow-xl">
              <Image
                src={profile.avatarUrl}
                alt={profile.username}
                width={44}
                height={44}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>

            <span className="font-medium hidden md:block">
              {profile.username}
            </span>

            <svg
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              <div className="absolute right-0 mt-3 w-80 bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden z-50">
                {/* Cabecera */}
                <div className="px-6 py-5 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-[#E63946]/50">
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.username}
                        width={64}
                        height={64}
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{profile.username}</p>
                      <div className="flex gap-5 text-sm text-gray-300 mt-2">
                        <span className="flex items-center gap-1">
                          {profile.followers}
                        </span>
                        <span className="flex items-center gap-1">
                          {profile.following}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opciones */}
                <div className="py-3">
                  {/* Perfil */}
                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsOpen(false);
                    }}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/10 transition text-left"
                  >
                    {t.profile}
                  </button>

                  {/* Idioma: toggle Euskara / Castellano */}
                  <div className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/10 transition">
                    <span className="text-sm text-gray-200">
                      {language === "eu" ? "Hizkuntza" : "Idioma"}
                    </span>

                    <div className="ml-auto inline-flex items-center rounded-full bg-slate-800 p-1 text-xs text-slate-200">
                      <button
                        onClick={() => changeLanguage("eu")}
                        disabled={loadingLang || savingLang}
                        className={`px-3 py-1 rounded-full transition ${
                          language === "eu"
                            ? "bg-slate-50 text-slate-900"
                            : "bg-transparent"
                        }`}
                      >
                        Euskara
                      </button>
                      <button
                        onClick={() => changeLanguage("es")}
                        disabled={loadingLang || savingLang}
                        className={`px-3 py-1 rounded-full transition ${
                          language === "es"
                            ? "bg-slate-50 text-slate-900"
                            : "bg-transparent"
                        }`}
                      >
                        Castellano
                      </button>
                    </div>
                  </div>

                  {/* Cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-red-600/20 text-red-400 transition text-left"
                  >
                    {t.signOut}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
