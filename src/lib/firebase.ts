// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyA088577cTFA0zHj_sLfDba7AbMyiGN1XI",
    authDomain: "ikusmira-7a46d.firebaseapp.com",
    projectId: "ikusmira-7a46d",
    storageBucket: "ikusmira-7a46d.firebasestorage.app",
    messagingSenderId: "574841345344",
    appId: "1:574841345344:web:d9539eb30fb5a7df8896a5",
    measurementId: "G-ZE0N6XWZMM"
};

// Evitar inicializar dos veces en Next
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ exports que usas en toda la app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);   // 👈 ESTE ES EL QUE FALTABA

export default app;