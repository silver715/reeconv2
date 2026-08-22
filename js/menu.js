/* ==============================================
   MENU CONTROLLER — js/menu.js (v2.1)
   Lógica del Dashboard Principal: perfil, HUD de estadísticas,
   racha diaria, modal de materias y selector de grado.
   ============================================== */

import { auth, db } from './firebase-config.js?v=2.1';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initXP, checkStreak, getStreakBonus, getAvatarEmoji, getLvl, getVB } from './xp.js?v=2.1';

let pendingMode = null;
let pendingIsQuiz = false;

/* ── Requiere sesión real ── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "landing.html";
    return;
  }

  // 1. Cargar nombre del estudiante
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const name = snap.exists() ? snap.data().name : "Estudiante";
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = name;
  } catch (err) {
    console.warn("[Menu] Firestore users warning:", err.message);
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = "Estudiante";
  }

  // 2. Inicializar XP y racha diaria
  await initXP();
  const streakInfo = await checkStreak();

  // 3. Avatar en el Header
  const avatarEl = document.getElementById("userAvatar");
  const avatarImgEl = document.getElementById("userAvatarImg");
  if (avatarImgEl) {
    avatarImgEl.src = getAvatarImg();
  } else if (avatarEl) {
    avatarEl.textContent = getAvatarEmoji();
  }

  // 4. Estadísticas del HUD
  const userLevelEl = document.getElementById("userLevel");
  if (userLevelEl) userLevelEl.textContent = getLvl();

  const userVBEl = document.getElementById("userVB");
  if (userVBEl) userVBEl.textContent = getVB();

  // 5. Racha Diaria
  const streakBadge = document.getElementById("streakBadge");
  const streakCount = document.getElementById("streakCount");
  const streakBonusEl = document.getElementById("streakBonus");

  if (streakInfo.streak > 0 && streakBadge) {
    streakBadge.classList.remove("no-streak");
    if (streakCount) streakCount.textContent = streakInfo.streak;

    const bonus = getStreakBonus();
    if (bonus > 0 && streakBonusEl) {
      streakBonusEl.textContent = `+${bonus} XP extra`;
      streakBonusEl.style.display = "inline-block";
    }
  }
});

/* ── Selección de materia: abre el modal de grado ── */
window.selectSubject = function selectSubject(mode, icon, name) {
  pendingIsQuiz = (mode === 'quiz');

  if (pendingIsQuiz) {
    document.getElementById('modalIcon').textContent = '📝';
    document.getElementById('modalTitle').textContent = 'Elige la materia del Quiz';
    showSubjectSelection();
    return;
  }

  pendingMode = mode;
  document.getElementById('modalIcon').textContent = icon;
  document.getElementById('modalTitle').textContent = name;

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
  const modal = document.getElementById('gradeModal');
  if (modal) modal.classList.remove('show');
};

/* ── Modal en modo selección de materia (para Quiz) ── */
function showSubjectSelection() {
  const modalSub = document.querySelector('.modal-sub');
  if (modalSub) modalSub.textContent = '¿Sobre qué materia quieres responder preguntas? ⭐';

  const grid = document.querySelector('.grade-grid');
  if (!grid) return;

  grid.innerHTML = `
    <button class="grade-btn" onclick="confirmQuizSubject('math')">
      <span class="g-icon">📐</span>Matemáticas
    </button>
    <button class="grade-btn" onclick="confirmQuizSubject('spanish')">
      <span class="g-icon">✍️</span>Español
    </button>
    <button class="grade-btn" onclick="confirmQuizSubject('english')">
      <span class="g-icon">🌐</span>Inglés
    </button>
    <button class="grade-btn" onclick="confirmQuizSubject('science')">
      <span class="g-icon">🌱</span>Ciencias
    </button>
    <button class="grade-btn" onclick="confirmQuizSubject('social')">
      <span class="g-icon">🗺️</span>Sociales
    </button>
  `;
  document.getElementById('gradeModal').classList.add('show');
}

window.confirmQuizSubject = function(subject) {
  localStorage.setItem('racoon_mode', subject);
  closeModal();
  navigateTo('quiz.html');
};

/* ── Restaurar modal a modo selección de grado (para Chat) ── */
function restoreGradeGrid() {
  const modalSub = document.querySelector('.modal-sub');
  if (modalSub) modalSub.innerHTML = '¿En qué grado estás?<br>El mapache ajusta sus explicaciones para ti 🦝';

  const grid = document.querySelector('.grade-grid');
  if (!grid) return;

  grid.innerHTML = `
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

/* ── Cerrar sesión ── */
window.handleLogout = async function handleLogout() {
  try {
    await signOut(auth);
    window.location.href = "landing.html";
  } catch (err) {
    console.error("[Menu] Error al cerrar sesión:", err);
    window.location.href = "landing.html";
  }
};
