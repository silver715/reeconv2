/* ==============================
   MENU — js/menu.js
   Lógica de index.html: sesión real, racha diaria,
   avatar personalizado y modal de grado.
   ============================== */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initXP, checkStreak, getStreakBonus, getAvatarEmoji } from './xp.js';

let pendingMode = null;
let pendingIsQuiz = false; // Para saber si el modal es para quiz o chat

/* ─── Requiere sesión real ─── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "landing.html";
    return;
  }

  /* Cargar nombre del usuario desde Firestore con fallback */
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const name = snap.exists() ? snap.data().name : "Estudiante";
    document.getElementById("userName").textContent = name;
  } catch (err) {
    console.warn("Firestore users collection warning (usando nombre por defecto):", err.message);
    document.getElementById("userName").textContent = "Estudiante";
  }

  /* Inicializar sistema de XP y verificar racha diaria */
  await initXP();
  const streakInfo = await checkStreak();

  /* Mostrar avatar personalizado */
  const avatarEl = document.getElementById("userAvatar");
  if (avatarEl) avatarEl.textContent = getAvatarEmoji();

  /* Mostrar racha diaria si existe */
  const streakBadge = document.getElementById("streakBadge");
  const streakCount = document.getElementById("streakCount");
  const streakBonusEl = document.getElementById("streakBonus");

  if (streakInfo.streak > 0 && streakBadge) {
    streakBadge.classList.remove("no-streak");
    streakCount.textContent = streakInfo.streak;

    const bonus = getStreakBonus();
    if (bonus > 0) {
      streakBonusEl.textContent = `+${bonus} XP extra`;
    } else {
      streakBonusEl.style.display = "none";
    }
  }
});

/* ── Selección de materia: abre el modal de grado ── */
window.selectSubject = function selectSubject(mode, icon, name) {
  /* Si es quiz, marcamos para redirigir a quiz.html en vez de chat.html */
  pendingIsQuiz = (mode === 'quiz');

  /* Para quiz, el ícono y nombre se usan del modal.
     Pedimos materia primero (reutilizamos el mismo modal) */
  if (pendingIsQuiz) {
    document.getElementById('modalIcon').textContent = '📝';
    document.getElementById('modalTitle').textContent = 'Elige la materia del Quiz';

    /* Mostrar botones de materia en vez de grado */
    showSubjectSelection();
    return;
  }

  pendingMode = mode;
  document.getElementById('modalIcon').textContent = icon;
  document.getElementById('modalTitle').textContent = name;

  /* Restaurar grid de grados (por si venía de quiz) */
  restoreGradeGrid();
  document.getElementById('gradeModal').classList.add('show');
};

/* ── Confirmar grado y navegar ── */
window.confirmGrade = function confirmGrade(grade) {
  if (pendingMode) {
    localStorage.setItem('racoon_mode', pendingMode);
  }
  localStorage.setItem('racoon_grade', grade || 'Primero');
  closeModal();

  if (pendingIsQuiz) {
    navigateTo('quiz.html');
  } else {
    goToChat(pendingMode || localStorage.getItem('racoon_mode') || 'math');
  }
};

/* ── Cerrar modal ── */
window.closeModal = function closeModal() {
  document.getElementById('gradeModal').classList.remove('show');
  pendingMode = null;
  pendingIsQuiz = false;
};

/* ── Cerrar sesión ── */
window.handleLogout = function handleLogout() {
  signOut(auth).then(() => {
    navigateTo("landing.html");
  });
};

/* ── Selección de materia para quiz ── */
function showSubjectSelection() {
  const gradeGrid = document.querySelector('.grade-grid');
  const modalSub = document.querySelector('.modal-sub');
  modalSub.textContent = '¿En qué materia quieres hacer el quiz? 📝';

  gradeGrid.innerHTML = `
    <button class="grade-btn" onclick="selectQuizSubject('math')">
      <span class="g-icon">📐</span>Matemáticas
    </button>
    <button class="grade-btn" onclick="selectQuizSubject('spanish')">
      <span class="g-icon">✍️</span>Español
    </button>
    <button class="grade-btn" onclick="selectQuizSubject('english')">
      <span class="g-icon">🌐</span>Inglés
    </button>
    <button class="grade-btn" onclick="selectQuizSubject('science')">
      <span class="g-icon">🌱</span>Naturales
    </button>
    <button class="grade-btn" onclick="selectQuizSubject('social')">
      <span class="g-icon">🗺️</span>Sociales
    </button>
  `;
  document.getElementById('gradeModal').classList.add('show');
}

/* ── Cuando elige materia de quiz, redirigir directo ── */
window.selectQuizSubject = function selectQuizSubject(mode) {
  localStorage.setItem('racoon_mode', mode);
  closeModal();
  navigateTo('quiz.html');
};

/* ── Restaurar el grid de grados al estado original ── */
function restoreGradeGrid() {
  const gradeGrid = document.querySelector('.grade-grid');
  const modalSub = document.querySelector('.modal-sub');
  modalSub.innerHTML = '¿En qué grado estás?<br>El mapache ajusta sus explicaciones para ti 🦝';

  gradeGrid.innerHTML = `
    <button class="grade-btn" onclick="confirmGrade('Transición')">
      <span class="g-icon">🌱</span>Transición
    </button>
    <button class="grade-btn" onclick="confirmGrade('Primero')">
      <span class="g-icon">1️⃣</span>Primero
    </button>
    <button class="grade-btn" onclick="confirmGrade('Segundo')">
      <span class="g-icon">2️⃣</span>Segundo
    </button>
    <button class="grade-btn" onclick="confirmGrade('Tercero')">
      <span class="g-icon">3️⃣</span>Tercero
    </button>
    <button class="grade-btn" onclick="confirmGrade('Cuarto')">
      <span class="g-icon">4️⃣</span>Cuarto
    </button>
  `;
}

/* Cerrar al click fuera del modal */
document.getElementById('gradeModal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});
