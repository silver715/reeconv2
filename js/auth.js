/* ==============================
   AUTH — js/auth.js
   Login y registro reales con Firebase
   ============================== */

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Referencias al DOM ── */
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const nameInput      = document.getElementById("regName");
const nameGroup      = document.getElementById("nameGroup");
const rememberMe    = document.getElementById("rememberMe");
const errorMsg      = document.getElementById("error-msg");
const loginBtn      = document.getElementById("loginBtn");
const togglePwBtn   = document.getElementById("togglePw");
const btnText       = loginBtn.querySelector(".btn-text");
const modeText      = document.getElementById("toggleModeText");

let isRegisterMode = false;

/* Firebase usa correos, así que convertimos el "usuario" en un correo falso interno */
function usernameToEmail(username) {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return clean + "@racoon.local";
}

/* ── Si ya hay sesión activa, ir directo al menú ── */
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "index.html";
});

/* ── Restaurar usuario recordado ── */
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("rt_remember");
  if (saved) {
    usernameInput.value = saved;
    rememberMe.checked  = true;
  }
});

/* ── Mostrar / ocultar contraseña ── */
togglePwBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type      = isHidden ? "text" : "password";
  togglePwBtn.textContent = isHidden ? "🙈" : "👁️";
});

/* ── Enviar con Enter ── */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSubmit();
});

/* ── Alternar entre iniciar sesión / crear cuenta ── */
window.toggleMode = function toggleMode() {
  isRegisterMode = !isRegisterMode;
  nameGroup.style.display = isRegisterMode ? "flex" : "none";
  btnText.textContent = isRegisterMode ? "Crear cuenta" : "Entrar al aula";
  modeText.innerHTML = isRegisterMode
    ? `¿Ya tienes cuenta? <a href="#" onclick="toggleMode()">Inicia sesión</a>`
    : `¿No tienes cuenta? <a href="#" onclick="toggleMode()">Regístrate gratis</a>`;
  errorMsg.style.display = "none";
};

/* ── Función principal: login o registro según el modo ── */
window.handleSubmit = handleSubmit;
async function handleSubmit() {
  const username = usernameInput.value.trim();
  const password  = passwordInput.value;
  const name      = nameInput.value.trim();

  if (!username || !password || (isRegisterMode && !name)) {
    showError("Por favor completa todos los campos 📝");
    return;
  }
  if (password.length < 6) {
    showError("La contraseña debe tener al menos 6 caracteres 🔐");
    return;
  }

  setLoading(true);
  const email = usernameToEmail(username);

  try {
    if (isRegisterMode) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          name,
          username,
          createdAt: Date.now(),
        });
      } catch (docErr) {
        console.warn("Firestore users collection write warning:", docErr.message);
      }
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }

    if (rememberMe.checked) {
      localStorage.setItem("rt_remember", username);
    } else {
      localStorage.removeItem("rt_remember");
    }

    loginBtn.style.background = "linear-gradient(135deg, #00c49a, #009e7a)";
    btnText.textContent = "¡Entrando! 🎉";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 700);

  } catch (err) {
    setLoading(false);
    showError(translateError(err.code));
    passwordInput.value = "";
    passwordInput.focus();
  }
}

/* ── Traducir errores de Firebase a español amigable ── */
function translateError(code) {
  const map = {
    "auth/email-already-in-use": "Ese usuario ya existe, intenta iniciar sesión 🙂",
    "auth/invalid-email":        "Ese nombre de usuario no es válido, usa solo letras y números",
    "auth/weak-password":       "La contraseña es muy corta (mínimo 6 caracteres)",
    "auth/user-not-found":      "Usuario o contraseña incorrectos 🔐",
    "auth/wrong-password":      "Usuario o contraseña incorrectos 🔐",
    "auth/invalid-credential":  "Usuario o contraseña incorrectos 🔐",
    "auth/too-many-requests":   "Demasiados intentos, espera un momento ⏳",
    "auth/network-request-failed": "Sin conexión a internet — Firebase la necesita para el login 🌐",
  };
  return map[code] || "Ocurrió un error, intenta de nuevo 🦝";
}

/* ── Helpers de UI ── */
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
  clearTimeout(showError._timer);
  showError._timer = setTimeout(() => {
    errorMsg.style.display = "none";
  }, 4000);
}

function setLoading(state) {
  loginBtn.disabled = state;
  loginBtn.classList.toggle("loading", state);
  if (state) {
    btnText.textContent = isRegisterMode ? "Creando cuenta..." : "Entrando...";
  }
}
