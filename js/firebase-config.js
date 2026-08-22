/* ==============================
   firebase-config.js
   Conexión con Firebase (Auth + Firestore) y Gemini API
   ============================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Credenciales de Firebase ──
   Estas credenciales son públicas y seguras gracias a las
   Firestore Security Rules (ver firestore.rules). */
const firebaseConfig = {
  apiKey: "AIzaSyD470lQc8YBBNBPFVf7vWweb13Oe5EwH0c",
  authDomain: "rakun-ca4d1.firebaseapp.com",
  projectId: "rakun-ca4d1",
  storageBucket: "rakun-ca4d1.firebasestorage.app",
  messagingSenderId: "313338213780",
  appId: "1:313338213780:web:a33009cafaf95b246d0b81",
  measurementId: "G-EH51YCT05H"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

/* ── Gemini API (Google AI) ──
   Carga segura de clave:
   1. Desde js/env.js (ignorado en .gitignore)
   2. O desde localStorage ('rt_gemini_key')
   3. O clave de respaldo */
let localKey = "TU_GEMINI_API_KEY_AQUI";
try {
  const envModule = await import('./env.js').catch(() => null);
  if (envModule && envModule.ENV_GEMINI_KEY) {
    localKey = envModule.ENV_GEMINI_KEY;
  }
} catch (_) {}

if (localKey === "TU_GEMINI_API_KEY_AQUI") {
  const saved = localStorage.getItem("rt_gemini_key");
  if (saved) localKey = saved;
}

export const GEMINI_API_KEY = localKey;
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent";
