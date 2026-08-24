/* ==============================
   AUTH — js/auth.js (v3.0)
   Login y registro limpios con Firebase
   Esquema unificado: name, email, password, role
   ============================== */

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

/* ── Referencias al DOM ── */
const emailInput    = document.getElementById("emailInput") || document.getElementById("username");
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

let isRegisterMode = false;
let isSubmitting   = false;

if (loginBtn) {

  /* ── Si ya hay sesión activa (y no estamos creando cuenta), ir al menú ── */
  onAuthStateChanged(auth, (user) => {
    if (user && !isSubmitting) {
      window.location.href = "index.html";
    }
  });

  /* ── Restaurar correo recordado ── */
  window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("rt_remember_email") || localStorage.getItem("rt_remember");
    if (saved && emailInput) {
      emailInput.value = saved;
      if (rememberMe) rememberMe.checked = true;
    }
  });

  /* ── Mostrar / ocultar contraseña ── */
  if (togglePwBtn && passwordInput) {
    togglePwBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type      = isHidden ? "text" : "password";
      togglePwBtn.textContent = isHidden ? "🙈" : "👁️";
    });
  }

  /* ── Enviar con Enter ── */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSubmit();
  });

  /* ── Alternar entre iniciar sesión / crear cuenta ── */
  window.toggleMode = function toggleMode() {
    isRegisterMode = !isRegisterMode;
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
    if (errorMsg) errorMsg.style.display = "none";
  };

  /* ── Función principal: login o registro ── */
  window.handleSubmit = handleSubmit;
  async function handleSubmit() {
    const rawInput = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const name     = nameInput ? nameInput.value.trim() : "";

    if (!rawInput || !password || (isRegisterMode && !name)) {
      showError("Por favor completa todos los campos requeridos 📝");
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

        // 3. Crear documento en 'users' (Esquema limpio sin username repetido)
        const userDocPromise = setDoc(doc(db, "users", uid), {
          name: name,
          email: email,
          password: password,
          role: "student",
          createdAt: Date.now(),
        });

        // 4. Crear progreso en 'progress'
        const progressDocPromise = setDoc(doc(db, "progress", uid), {
          lvl: 1,
          xp: 0,
          vb: 100,
          streak: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          avatar: "raccoon_happy",
          unlockedAvatars: ["raccoon_happy", "raccoon_default"]
        });

        // Esperar que ambos documentos se escriban completamente en Firestore
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
        localStorage.removeItem("rt_remember");
      }

      if (loginBtn) loginBtn.style.background = "linear-gradient(135deg, #00c49a, #009e7a)";
      if (btnText) btnText.textContent = "¡Entrando! 🎉";

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
    errorMsg.style.display = "block";
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
      "auth/email-already-in-use": "Ese correo ya está registrado, intenta iniciar sesión 🙂",
      "auth/invalid-email":        "Ingresa un correo electrónico válido (ej: usuario@correo.com)",
      "auth/weak-password":       "La contraseña es muy débil (mínimo 6 caracteres con mayúscula, minúscula y número)",
      "auth/user-not-found":      "Correo o contraseña incorrectos 🔐",
      "auth/wrong-password":      "Correo o contraseña incorrectos 🔐",
      "auth/invalid-credential":  "Correo o contraseña incorrectos 🔐",
      "auth/too-many-requests":   "Demasiados intentos, espera un momento ⏳",
      "auth/network-request-failed": "Sin conexión a internet — verifica tu red 🌐",
    };
    return map[code] || ("Ocurrió un error: " + code);
  }
}
