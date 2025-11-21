"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type Language = "es" | "eu";

type Props = {
  className?: string;
};

export default function LanguageToggle({ className = "" }: Props) {
  const [language, setLanguage] = useState<Language>("es");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 🔁 Escuchar cambios de usuario (más fiable que auth.currentUser a pelo)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setLanguage("es");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data() as any | undefined;
        const lang = data?.languagePreference as Language | undefined;

        console.log("languagePreference desde Firestore:", lang);

        if (lang === "es" || lang === "eu") {
          setLanguage(lang);
        } else {
          setLanguage("es");
        }
      } catch (err) {
        console.error("Error cargando languagePreference:", err);
        setLanguage("es");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (newLang: Language) => {
    if (!user) {
      console.warn("No hay usuario autenticado para cambiar idioma.");
      return;
    }
    if (saving) return;
    if (newLang === language) return;

    try {
      setSaving(true);
      setLanguage(newLang); // UI inmediata

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        languagePreference: newLang,
      });

      console.log("languagePreference actualizado a:", newLang);

      // Para que el resto de la app coja el idioma nuevo al momento:
      window.location.reload();
    } catch (err) {
      console.error("Error actualizando languagePreference:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`inline-flex items-center rounded-full bg-slate-800 p-1 text-xs text-slate-400 ${className}`}
      >
        <span className="px-3 py-1 opacity-70">Euskara</span>
        <span className="px-3 py-1 opacity-70">Castellano</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full bg-slate-800 p-1 text-xs text-slate-200 ${className}`}
    >
      <button
        onClick={() => handleToggle("eu")}
        className={`px-3 py-1 rounded-full transition ${
          language === "eu" ? "bg-slate-50 text-slate-900" : "bg-transparent"
        }`}
      >
        Euskara
      </button>
      <button
        onClick={() => handleToggle("es")}
        className={`px-3 py-1 rounded-full transition ${
          language === "es" ? "bg-slate-50 text-slate-900" : "bg-transparent"
        }`}
      >
        Castellano
      </button>
    </div>
  );
}
