// Autenticación: inicio de sesión y registro de estudiantes con Firebase Auth

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { validatePassword, normalizeEmail } from './validators.js?v=1.0';

export { validatePassword, normalizeEmail };

// Referencias al DOM
const emailInput    = document.getElementById("emailInput");
const passwordInput = document.getElementById("password");
const nameInput     = document.getElementById("regName");
const nameGroup     = document.getElementById("nameGroup");
const rememberMe    = document.getElementById("rememberMe");
const errorMsg      = document.getElementById("error-msg");
const loginBtn      = document.getElementById("loginBtn");
const togglePwBtn   = document.getElementById("togglePw");
const btnText       = loginBtn ? loginBtn.querySelector(".btn-text") : null;
const modeText      = document.getElementById("toggleModeText");
const pwHint        = document.getElementById("pwHint");
const cardSubTitle  = document.getElementById("cardSubTitle");
const tabLogin      = document.getElementById("tabLogin");
const tabRegister   = document.getElementById("tabRegister");

let isRegisterMode = false;
let isSubmitting   = false;

if (loginBtn) {

  // Si ya hay sesión activa (y no estamos creando cuenta), ir al menú
  onAuthStateChanged(auth, (user) => {
    if (user && !isSubmitting) {
      window.location.href = "index.html";
    }
  });

  // Restaurar correo recordado y leer parámetros de URL
  window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("rt_remember_email");
    if (saved && emailInput) {
      emailInput.value = saved;
      if (rememberMe) rememberMe.checked = true;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "register") {
      window.setAuthMode("register");
    }
  });

  // Mostrar / ocultar contraseña con SVG limpio
  if (togglePwBtn && passwordInput) {
    togglePwBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      const eyeSvg = document.getElementById("eyeIconSvg");
      if (eyeSvg) {
        eyeSvg.innerHTML = isHidden
          ? `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line>`
          : `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  }

  // Enviar con Enter
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSubmit();
  });

  // Actualizar interfaz según el modo activo
  function updateModeUI() {
    if (nameGroup) nameGroup.style.display = isRegisterMode ? "block" : "none";
    if (pwHint) pwHint.classList.toggle("visible", isRegisterMode);
    if (cardSubTitle) {
      cardSubTitle.textContent = isRegisterMode ? "¡Crea tu cuenta de estudiante!" : "¡Bienvenido de vuelta!";
    }
    if (btnText) {
      btnText.textContent = isRegisterMode ? "Crear cuenta de estudiante" : "Entrar al aula";
    }
    if (modeText) {
      modeText.innerHTML = isRegisterMode
        ? `¿Ya tienes cuenta? <a href="#" onclick="toggleMode()">Inicia sesión</a>`
        : `¿No tienes cuenta? <a href="#" onclick="toggleMode()">Regístrate gratis</a>`;
    }
    if (tabLogin) tabLogin.classList.toggle("active", !isRegisterMode);
    if (tabRegister) tabRegister.classList.toggle("active", isRegisterMode);
    if (errorMsg) errorMsg.style.display = "none";
  }

  // Establecer modo explícito (login o register)
  window.setAuthMode = function setAuthMode(mode) {
    isRegisterMode = (mode === "register");
    updateModeUI();
  };

  // Alternar entre iniciar sesión / crear cuenta
  window.toggleMode = function toggleMode() {
    isRegisterMode = !isRegisterMode;
    updateModeUI();
  };

  // Función principal: login o registro
  window.handleSubmit = handleSubmit;
  async function handleSubmit() {
    const rawInput = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const name     = nameInput ? nameInput.value.trim() : "";

    if (!rawInput || !password || (isRegisterMode && !name)) {
      showError("Por favor completa todos los campos requeridos.");
      return;
    }

    if (isRegisterMode) {
      const pwError = validatePassword(password);
      if (pwError) {
        showError(pwError);
        return;
      }
    }

    setLoading(true);
    isSubmitting = true;
    const email = normalizeEmail(rawInput);

    try {
      if (isRegisterMode) {
        // 1. Crear credenciales en Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // 2. Asignar nombre en Auth
        await updateProfile(cred.user, { displayName: name }).catch(() => {});

        // 3. Crear documento en 'users' (Esquema limpio)
        const userDocPromise = setDoc(doc(db, "users", uid), {
          name: name,
          email: email,
          password: password,
          role: "student",
          createdAt: Date.now(),
        });

        // 4. Crear progreso inicial en 'progress'
        const progressDocPromise = setDoc(doc(db, "progress", uid), {
          lvl: 1,
          xp: 0,
          vb: 100,
          streak: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          avatar: "raccoon_happy",
          unlockedAvatars: ["raccoon_happy", "raccoon_default"]
        });

        // Esperar que ambos documentos se escriban en Firestore
        await Promise.all([userDocPromise, progressDocPromise]);

      } else {
        // Iniciar sesión existente
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // Sincronizar contraseña y email en Firestore 'users'
        await setDoc(doc(db, "users", uid), {
          email: email,
          password: password
        }, { merge: true }).catch((err) => console.warn("Firestore password sync:", err.message));
      }

      // Guardar preferencia de recordar correo
      if (rememberMe && rememberMe.checked) {
        localStorage.setItem("rt_remember_email", rawInput);
      } else {
        localStorage.removeItem("rt_remember_email");
      }

      if (loginBtn) loginBtn.classList.add("success");
      if (btnText) btnText.textContent = "¡Entrando al aula!";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 400);

    } catch (err) {
      isSubmitting = false;
      setLoading(false);
      showError(translateError(err.code || err.message));
      if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
      }
    }
  }

  function showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = msg;
    errorMsg.style.display = "flex";
    clearTimeout(showError._timer);
    showError._timer = setTimeout(() => {
      errorMsg.style.display = "none";
    }, 5000);
  }

  function setLoading(state) {
    if (!loginBtn) return;
    loginBtn.disabled = state;
    loginBtn.classList.toggle("loading", state);
    if (state && btnText) {
      btnText.textContent = isRegisterMode ? "Creando cuenta..." : "Entrando...";
    }
  }

  function translateError(code) {
    const map = {
      "auth/email-already-in-use": "Ese correo ya está registrado. Por favor inicia sesión.",
      "auth/invalid-email":        "Ingresa un correo electrónico válido (ej: usuario@correo.com).",
      "auth/weak-password":       "La contraseña debe tener mínimo 6 caracteres con mayúscula, minúscula y número.",
      "auth/user-not-found":      "Correo o contraseña incorrectos.",
      "auth/wrong-password":      "Correo o contraseña incorrectos.",
      "auth/invalid-credential":  "Correo o contraseña incorrectos.",
      "auth/too-many-requests":   "Demasiados intentos fallidos. Por favor espera un momento antes de reintentar.",
      "auth/network-request-failed": "Sin conexión a internet. Verifica tu red.",
    };
    return map[code] || ("Ocurrió un error: " + code);
  }
}
