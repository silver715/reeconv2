/* ==============================================
   MENU CONTROLLER — js/menu.js (v2.6)
   Lógica del Dashboard Principal: perfil, HUD de estadísticas,
   racha diaria, modal de materias, selector de grado y
   gestión de perfil/contraseña del estudiante.
   ============================================== */

import { auth, db } from './firebase-config.js?v=2.4';
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initXP, checkStreak, getStreakBonus, getAvatarEmoji, getAvatarImg, getLvl, getVB } from './xp.js?v=3.0';
import { validatePassword } from './validators.js?v=1.0';

let pendingMode = null;
let pendingIsQuiz = false;
let currentUserProfile = null;

/* ── Requiere sesión real ── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "landing.html";
    return;
  }

  // 1. Cargar o auto-crear datos del usuario en Firestore 'users'
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      currentUserProfile = snap.data();
    } else {
      currentUserProfile = {
        name: user.displayName || "Estudiante",
        email: user.email || "",
        role: "student",
        createdAt: Date.now()
      };
      // Auto-reparar creando el documento en Firestore
      await setDoc(userRef, currentUserProfile, { merge: true });
    }

    const name = currentUserProfile.name || user.displayName || "Estudiante";
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = name;

    // Mostrar botón de Admin Panel solo si tiene rol 'admin'
    const adminLink = document.getElementById("adminPanelLink");
    if (adminLink) {
      adminLink.style.display = (currentUserProfile.role === "admin") ? "inline-flex" : "none";
    }

  } catch (err) {
    console.warn("[Menu] Firestore users warning:", err.message);
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = user.displayName || "Estudiante";
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

/* ── MODAL DE MI PERFIL Y SEGURIDAD ── */
window.openProfileModal = function openProfileModal() {
  const modal = document.getElementById("profileModal");
  if (!modal) return;

  const profName  = document.getElementById("profName");
  const profEmail = document.getElementById("profEmail");
  const alertEl   = document.getElementById("profileAlert");

  if (alertEl) alertEl.style.display = "none";

  if (currentUserProfile) {
    if (profName) profName.value   = currentUserProfile.name || (auth.currentUser ? auth.currentUser.displayName : "") || "";
    if (profEmail) profEmail.value = auth.currentUser ? auth.currentUser.email : "";
  }

  switchProfileTab('info');
  modal.classList.add("show");
};

window.closeProfileModal = function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  if (modal) modal.classList.remove("show");
};

window.switchProfileTab = function switchProfileTab(tab) {
  const tabBtnProfile  = document.getElementById("tabBtnProfile");
  const tabBtnPassword = document.getElementById("tabBtnPassword");
  const infoForm       = document.getElementById("profileInfoForm");
  const passwordForm   = document.getElementById("profilePasswordForm");
  const alertEl        = document.getElementById("profileAlert");

  if (alertEl) alertEl.style.display = "none";

  if (tab === 'info') {
    if (tabBtnProfile) tabBtnProfile.classList.add("active");
    if (tabBtnPassword) tabBtnPassword.classList.remove("active");
    if (infoForm) infoForm.style.display = "block";
    if (passwordForm) passwordForm.style.display = "none";
  } else {
    if (tabBtnProfile) tabBtnProfile.classList.remove("active");
    if (tabBtnPassword) tabBtnPassword.classList.add("active");
    if (infoForm) infoForm.style.display = "none";
    if (passwordForm) passwordForm.style.display = "block";
  }
};

/* ── Actualizar Datos de Perfil ── */
window.handleUpdateProfile = async function handleUpdateProfile(e) {
  e.preventDefault();

  if (!auth.currentUser) return;

  const newName = document.getElementById("profName").value.trim();
  const saveBtn = document.getElementById("btnSaveProfileInfo");

  if (!newName) {
    showProfileAlert("Por favor ingresa tu nombre 📝", "error");
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando cambios...";
  }

  try {
    const uid = auth.currentUser.uid;

    // 1. Guardar de forma segura en Firestore (con merge: true)
    await setDoc(doc(db, "users", uid), {
      name: newName,
      email: auth.currentUser.email || ""
    }, { merge: true });

    // 2. Actualizar displayName en Firebase Auth
    await updateProfile(auth.currentUser, { displayName: newName }).catch(() => {});

    // 3. Actualizar UI y estado en memoria
    if (!currentUserProfile) currentUserProfile = {};
    currentUserProfile.name = newName;

    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = newName;

    showProfileAlert("¡Nombre actualizado con éxito! ✨", "success");

  } catch (err) {
    console.error("[Profile] Error al actualizar perfil:", err);
    showProfileAlert("Error al guardar: " + err.message, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Cambios de Perfil";
    }
  }
};

/* ── Actualizar Contraseña del Estudiante ── */
window.handleUpdatePassword = async function handleUpdatePassword(e) {
  e.preventDefault();

  if (!auth.currentUser) return;

  const currentPw = document.getElementById("profCurrentPw").value;
  const newPw     = document.getElementById("profNewPw").value;
  const confirmPw = document.getElementById("profConfirmPw").value;
  const saveBtn   = document.getElementById("btnSavePassword");

  if (newPw !== confirmPw) {
    showProfileAlert("Las contraseñas nuevas no coinciden 🔐", "error");
    return;
  }

  // Validar complejidad de la nueva clave
  const pwError = validatePassword(newPw);
  if (pwError) {
    showProfileAlert(pwError, "error");
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Validando y actualizando...";
  }

  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPw);

    // 1. Reautenticar con la clave actual
    await reauthenticateWithCredential(user, credential);

    // 2. Actualizar contraseña en Firebase Auth
    await updatePassword(user, newPw);

    // 3. Sincronizar contraseña en Firestore users
    try {
      await updateDoc(doc(db, "users", user.uid), {
        password: newPw
      });
    } catch (dbErr) {
      console.warn("Firestore password sync warning:", dbErr.message);
    }

    // 4. Limpiar formulario
    document.getElementById("profCurrentPw").value = "";
    document.getElementById("profNewPw").value     = "";
    document.getElementById("profConfirmPw").value = "";

    showProfileAlert("✅ ¡Contraseña actualizada exitosamente!", "success");

  } catch (err) {
    console.error("[Profile] Error al cambiar contraseña:", err);
    let msg = "Error al actualizar contraseña 🔐";
    if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      msg = "Tu contraseña actual es incorrecta ❌";
    } else if (err.code === "auth/weak-password") {
      msg = "La nueva contraseña es muy débil (mín. 6 chars con mayúscula, minúscula y número)";
    }
    showProfileAlert(msg, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Actualizar Contraseña";
    }
  }
};

function showProfileAlert(msg, type = "success") {
  const alertEl = document.getElementById("profileAlert");
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.className = `profile-alert ${type}`;
  alertEl.style.display = "block";
}

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
  localStorage.setItem('racoon_grade', grade || 'Cuarto');
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

  grid.style.gridTemplateColumns = "repeat(3, 1fr)";
  grid.style.maxWidth = "none";

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

  grid.style.gridTemplateColumns = "repeat(2, 1fr)";
  grid.style.maxWidth = "280px";
  grid.style.margin = "0 auto 24px";

  grid.innerHTML = `
    <button class="grade-btn" onclick="confirmGrade('Cuarto')">
      <span class="g-icon">4️⃣</span>Cuarto
    </button>
    <button class="grade-btn" onclick="confirmGrade('Quinto')">
      <span class="g-icon">5️⃣</span>Quinto
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

