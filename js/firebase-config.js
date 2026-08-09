/* ==============================
   firebase-config.js
   Conexión con Firebase (Auth + Firestore) y Gemini API
   ============================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Credenciales de Firebase ──
   Estas credenciales son públicas y seguras gracias a las
   Firestore Security Rules (ver firestore.rules).
   Para usar tu propio proyecto, reemplaza este objeto con el
   que te da Firebase al registrar tu app web. */
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
   API key gratuita obtenida en https://aistudio.google.com
   Usamos el modelo gemini-2.0-flash por su velocidad y capa gratuita generosa.
   En un proyecto de producción, esta key iría en un backend/Cloud Function. */
export const GEMINI_API_KEY = "AIzaSyBRiiaU6aqWbXLJynb4Qx-phbIKs41HjA0";
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
