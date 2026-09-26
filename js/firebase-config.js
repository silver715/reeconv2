// Configuración de Firebase: conexión con Authentication y Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Credenciales de Firebase Estas credenciales son públicas y seguras gracias a las Firestore Security Rules (ver firestore.rules).
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

import { ENV_GEMINI_KEY } from './env.js?v=3.9';

// Gemini API (Google AI)
let localKey = (typeof ENV_GEMINI_KEY !== 'undefined' && ENV_GEMINI_KEY) ? ENV_GEMINI_KEY : "TU_GEMINI_API_KEY_AQUI";
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem("rt_gemini_key") : null;
if (saved && saved !== "TU_GEMINI_API_KEY_AQUI" && saved.trim().length > 0) {
  localKey = saved;
}

export const GEMINI_API_KEY = localKey;
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";
