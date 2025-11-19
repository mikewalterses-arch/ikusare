// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA088577cTFA0zHj_sLfDba7AbMyiGN1XI",
    authDomain: "ikusmira-7a46d.firebaseapp.com",
    projectId: "ikusmira-7a46d",
    storageBucket: "ikusmira-7a46d.firebasestorage.app",
    messagingSenderId: "574841345344",
    appId: "1:574841345344:web:d9539eb30fb5a7df8896a5",
    measurementId: "G-ZE0N6XWZMM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);