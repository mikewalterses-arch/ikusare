// src/hooks/useUserLanguage.ts
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type Language = "es" | "eu";

export function useUserLanguage() {
  const [language, setLanguage] = useState<Language>("es");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLanguage("es");
        setLoading(false);
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
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { language, setLanguage, loading };
}
