/* ==============================================
   ADMIN CONTROLLER — js/admin.js (v3.0)
   Consola de administración y desarrollo CRUD de Firebase
   Esquema limpio: users (name, email, password, role)
                   progress (lvl, xp, vb, streak, lastActiveDate, avatar, unlockedAvatars)
   ============================================== */

import { auth, db } from './firebase-config.js?v=2.4';
import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { validatePassword } from './validators.js?v=1.0';

const ADMIN_EMAILS = [
  '327nikov@gmail.com',
  'admin@racoon.local'
];

let currentAdminUser = null;
let allStudents = [];
let filteredStudents = [];

const AVATAR_IMAGES = {
  'raccoon_happy':    'img/avatars/raccoon_happy.png',
  'raccoon_default':  'img/avatars/raccoon_happy.png',
  'raccoon_bandaid':  'img/avatars/raccoon_bandaid.png',
  'raccoon_ghost':    'img/avatars/raccoon_ghost.png',
  'raccoon_knife':    'img/avatars/raccoon_knife.png',
  'raccoon_melt':     'img/avatars/raccoon_melt.png',
  'raccoon_sad':      'img/avatars/raccoon_sad.png',
  'raccoon_skeleton': 'img/avatars/raccoon_skeleton.png',
  'raccoon_sleepy':   'img/avatars/raccoon_sleepy.png',
  'raccoon_trashcan': 'img/avatars/raccoon_trashcan.png',
};

/* ── 1. GUARD DE ACCESO EXCLUSIVO PARA ADMINISTRADOR ── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "user.html";
    return;
  }

  currentAdminUser = user;
  const userEmail = (user.email || "").toLowerCase();
  const isMasterAdmin = ADMIN_EMAILS.includes(userEmail);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (isMasterAdmin) {
      // Tu cuenta principal siempre tiene rol de admin asegurado en Firestore
      await setDoc(userDocRef, {
        name: user.displayName || "Admin",
        email: user.email,
        role: "admin",
        createdAt: Date.now()
      }, { merge: true });
    } else {
      if (!userSnap.exists() || userSnap.data().role !== "admin") {
        alert("⛔ Acceso denegado: Este panel de desarrollo es exclusivo para el administrador.");
        window.location.href = "index.html";
        return;
      }
    }

    await loadAdminData();

  } catch (err) {
    console.error("[Admin] Error al verificar permisos:", err);
    showToast("Error al verificar permisos: " + err.message, "error");
  }
});

/* ── 2. CARGA Y UNIÓN RELACIONAL DE DATOS (READ + AUTO-CLEAN) ── */
export async function loadAdminData() {
  const tbody = document.getElementById("adminTableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: var(--text2);">
          Consultando base de datos de Firebase en tiempo real... 🦝
        </td>
      </tr>
    `;
  }

  try {
    const usersMap = {};
    const progressMap = {};

    // Consultar colección 'users' (y auto-limpiar campos viejos)
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach((d) => {
      const uData = d.data();
      usersMap[d.id] = { id: d.id, ...uData };
      if (uData.username !== undefined) {
        updateDoc(doc(db, "users", d.id), { username: deleteField() }).catch(() => {});
      }
    });

    // Consultar colección 'progress' (y auto-limpiar campo coins viejo)
    const progressSnap = await getDocs(collection(db, "progress"));
    progressSnap.forEach((d) => {
      const pData = d.data();
      progressMap[d.id] = { id: d.id, ...pData };
      if (pData.coins !== undefined) {
        updateDoc(doc(db, "progress", d.id), { coins: deleteField() }).catch(() => {});
      }
    });

    // Unir datos de ambas colecciones por ID
    const combined = [];
    const allIds = new Set([...Object.keys(usersMap), ...Object.keys(progressMap)]);

    allIds.forEach((uid) => {
      const u = usersMap[uid] || {};
      const p = progressMap[uid] || {};

      combined.push({
        id: uid,
        name: u.name || (u.email ? u.email.split("@")[0] : `Estudiante ${uid.slice(0, 4)}`),
        email: u.email || `${uid.slice(0, 6)}@racoon.local`,
        password: u.password || "",
        role: u.role || "student",
        createdAt: u.createdAt || Date.now(),
        level: p.lvl || p.level || 1,
        xp: p.xp || 0,
        vb: p.vb ?? 100,
        streak: p.streak || 1,
        avatar: p.avatar || "raccoon_happy"
      });
    });

    allStudents = combined;
    updateKPICards(allStudents);
    handleSearchFilter();

  } catch (err) {
    console.error("[Admin] Error al cargar datos:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--danger);">
            Error al conectar con Firestore: ${err.message}
          </td>
        </tr>
      `;
    }
    showToast("Error al cargar la base de datos", "error");
  }
}

/* ── 3. ACTUALIZAR KPIs SUPERIORES ── */
function updateKPICards(data) {
  const studentsOnly = data.filter(s => s.role !== 'admin');
  const totalStudents = studentsOnly.length || data.length;
  
  let totalXP = 0;
  let totalLevel = 0;
  let totalVB = 0;

  data.forEach((s) => {
    totalXP += (Number(s.xp) || 0) + ((Number(s.level) || 1) - 1) * 1000;
    totalLevel += Number(s.level) || 1;
    totalVB += Number(s.vb) || 0;
  });

  const avgLevel = data.length > 0 ? (totalLevel / data.length).toFixed(1) : "1.0";

  const kpiTotalStudents = document.getElementById("kpiTotalStudents");
  const kpiTotalXP       = document.getElementById("kpiTotalXP");
  const kpiAvgLevel      = document.getElementById("kpiAvgLevel");
  const kpiTotalVB       = document.getElementById("kpiTotalVB");

  if (kpiTotalStudents) kpiTotalStudents.textContent = totalStudents;
  if (kpiTotalXP)       kpiTotalXP.textContent = totalXP.toLocaleString();
  if (kpiAvgLevel)      kpiAvgLevel.textContent = avgLevel;
  if (kpiTotalVB)       kpiTotalVB.textContent = totalVB.toLocaleString();
}

/* ── 4. RENDERIZAR TABLA DE USUARIOS ── */
function renderStudentsTable(students) {
  const tbody = document.getElementById("adminTableBody");
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text2);">
          No se encontraron usuarios que coincidan con la búsqueda. 🔍
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map((s) => {
    const avatarImg = AVATAR_IMAGES[s.avatar] || AVATAR_IMAGES['raccoon_happy'];
    const roleBadge = s.role === 'admin' 
      ? `<span class="badge-tag badge-role-admin">👑 Admin</span>`
      : `<span class="badge-tag badge-role-student">🎓 Estudiante</span>`;

    return `
      <tr>
        <td>
          <div class="student-cell">
            <img class="student-avatar" src="${avatarImg}" alt="Avatar" />
            <div>
              <div class="student-info-name">${escapeHtml(s.name)}</div>
              <div class="student-info-email">${escapeHtml(s.email)} <span style="opacity:0.6; font-size:0.7rem;">(${s.id.slice(0, 8)}...)</span></div>
              <div style="font-size:0.75rem; color:var(--text2); margin-top:2px;">🔑 Clave: <code style="color:var(--cyan); background:rgba(0,229,255,0.1); padding:1px 6px; border-radius:4px; font-family:monospace;">${escapeHtml(s.password || 'No registrada')}</code></div>
            </div>
          </div>
        </td>
        <td><span style="color:var(--cyan); font-weight:700;">Nivel ${s.level}</span></td>
        <td>${s.xp} XP</td>
        <td><span style="color:var(--gold); font-weight:700;">💎 ${s.vb}</span></td>
        <td>🔥 ${s.streak} d</td>
        <td>${roleBadge}</td>
        <td style="text-align: right;">
          <div class="action-buttons" style="justify-content: flex-end;">
            <button class="btn-icon" title="Editar datos" onclick="openEditModal('${s.id}')">✏️</button>
            <button class="btn-icon" title="Reestablecer contraseña" onclick="openPasswordModal('${s.id}', '${escapeHtml(s.name)}', '${escapeHtml(s.email)}')">🔑</button>
            <button class="btn-icon delete" title="Eliminar usuario" onclick="openDeleteModal('${s.id}', '${escapeHtml(s.name)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── 5. FILTRADO Y BÚSQUEDA ── */
window.handleSearchFilter = function handleSearchFilter() {
  const searchInput = document.getElementById("adminSearchInput");
  const sortFilter  = document.getElementById("adminSortFilter");

  const query  = (searchInput ? searchInput.value : "").toLowerCase().trim();
  const sortBy = sortFilter ? sortFilter.value : "xp-desc";

  filteredStudents = allStudents.filter((s) => {
    return (
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query)
    );
  });

  // Ordenar
  filteredStudents.sort((a, b) => {
    if (sortBy === "xp-desc") {
      const aTotal = (a.level - 1) * 1000 + a.xp;
      const bTotal = (b.level - 1) * 1000 + b.xp;
      return bTotal - aTotal;
    }
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "lvl-desc")  return b.level - a.level;
    if (sortBy === "vb-desc") return b.vb - a.vb;
    return 0;
  });

  renderStudentsTable(filteredStudents);
};

/* ── 6. CREAR USUARIO (CREATE) ── */
window.openCreateModal = function openCreateModal() {
  const form = document.getElementById("createStudentForm");
  if (form) form.reset();
  openAdminModal("createStudentModal");
};

window.handleCreateStudentSubmit = async function handleCreateStudentSubmit(e) {
  e.preventDefault();

  const name     = document.getElementById("createName").value.trim();
  const email    = document.getElementById("createEmail").value.trim().toLowerCase();
  const password = document.getElementById("createPassword").value;
  const role     = document.getElementById("createRole").value || "student";
  const level    = parseInt(document.getElementById("createLevel").value, 10) || 1;
  const vb       = parseInt(document.getElementById("createVB")?.value || "100", 10) || 100;

  const pwError = validatePassword(password);
  if (pwError) {
    showToast(pwError, "error");
    return;
  }

  const submitBtn = document.getElementById("btnSubmitCreate");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";
  }

  try {
    const newUid = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    // 1. Guardar en 'users'
    const userPromise = setDoc(doc(db, "users", newUid), {
      name: name,
      email: email,
      password: password,
      role: role,
      createdAt: Date.now()
    });

    // 2. Guardar en 'progress' (Solo vb)
    const progressPromise = setDoc(doc(db, "progress", newUid), {
      lvl: level,
      xp: 0,
      vb: vb,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      avatar: "raccoon_happy",
      unlockedAvatars: ["raccoon_happy", "raccoon_default"]
    });

    await Promise.all([userPromise, progressPromise]);

    closeAdminModal("createStudentModal");
    showToast("✅ Usuario registrado exitosamente en Firebase", "success");
    await loadAdminData();

  } catch (err) {
    console.error("[Admin] Error al crear usuario:", err);
    showToast("Error al guardar en Firebase: " + err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar en Firebase";
    }
  }
};

/* ── 7. EDITAR USUARIO (UPDATE) ── */
window.openEditModal = function openEditModal(userId) {
  const student = allStudents.find(s => s.id === userId);
  if (!student) return;

  document.getElementById("editUserId").value   = student.id;
  document.getElementById("editName").value     = student.name;
  document.getElementById("editLevel").value    = student.level;
  document.getElementById("editXP").value       = student.xp;
  if (document.getElementById("editVB")) {
    document.getElementById("editVB").value = student.vb;
  }
  document.getElementById("editStreak").value   = student.streak;
  document.getElementById("editRole").value     = student.role || "student";
  document.getElementById("editPassword").value = student.password || "";

  openAdminModal("editStudentModal");
};

window.handleEditStudentSubmit = async function handleEditStudentSubmit(e) {
  e.preventDefault();

  const userId   = document.getElementById("editUserId").value;
  const name     = document.getElementById("editName").value.trim();
  const level    = parseInt(document.getElementById("editLevel").value, 10) || 1;
  const xp       = parseInt(document.getElementById("editXP").value, 10) || 0;
  const vb       = parseInt(document.getElementById("editVB")?.value || "100", 10) || 0;
  const streak   = parseInt(document.getElementById("editStreak").value, 10) || 0;
  const role     = document.getElementById("editRole").value;
  const password = document.getElementById("editPassword").value.trim();

  const submitBtn = document.getElementById("btnSubmitEdit");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Actualizando...";
  }

  try {
    // 1. Guardar de forma segura en colección 'users' (con merge: true)
    const userPayload = {
      name: name,
      role: role
    };
    if (password) userPayload.password = password;

    const userPromise = setDoc(doc(db, "users", userId), userPayload, { merge: true });

    // 2. Guardar de forma segura en colección 'progress' (con merge: true)
    const progressPromise = setDoc(doc(db, "progress", userId), {
      lvl: level,
      xp: xp,
      vb: vb,
      streak: streak
    }, { merge: true });

    await Promise.all([userPromise, progressPromise]);

    closeAdminModal("editStudentModal");
    showToast("✅ Datos actualizados correctamente en Firestore", "success");
    await loadAdminData();

  } catch (err) {
    console.error("[Admin] Error al actualizar:", err);
    showToast("Error al guardar en Firestore: " + err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Actualizar Firestore";
    }
  }
};

/* ── 8. REESTABLECER CONTRASEÑA ── */
window.openPasswordModal = function openPasswordModal(userId, name, email) {
  document.getElementById("pwUserId").value = userId;
  document.getElementById("pwUserEmail").value = email;
  document.getElementById("pwStudentName").textContent = `${name} (${email})`;
  document.getElementById("adminNewPassword").value = "";
  openAdminModal("passwordModal");
};

window.handlePasswordSubmit = async function handlePasswordSubmit(e) {
  e.preventDefault();

  const userId = document.getElementById("pwUserId").value;
  const email  = document.getElementById("pwUserEmail").value;
  const newPw  = document.getElementById("adminNewPassword").value;

  const pwError = validatePassword(newPw);
  if (pwError) {
    showToast(pwError, "error");
    return;
  }

  try {
    if (userId) {
      await setDoc(doc(db, "users", userId), {
        password: newPw
      }, { merge: true });
    }

    if (email && email.includes("@") && !email.endsWith("@racoon.local")) {
      await sendPasswordResetEmail(auth, email).catch(() => {});
      showToast(`🔑 Contraseña guardada en Firestore y enlace enviado a ${email}`, "success");
    } else {
      showToast(`🔑 Contraseña actualizada en Firestore para ${email}`, "success");
    }

    closeAdminModal("passwordModal");
    await loadAdminData();
  } catch (err) {
    console.error("[Admin] Error al reestablecer contraseña:", err);
    showToast("Error: " + err.message, "error");
  }
};

/* ── 9. ELIMINAR USUARIO (DELETE) ── */
window.openDeleteModal = function openDeleteModal(userId, name) {
  document.getElementById("deleteUserId").value = userId;
  document.getElementById("deleteStudentName").textContent = name;
  openAdminModal("deleteConfirmModal");
};

window.executeStudentDelete = async function executeStudentDelete() {
  const userId = document.getElementById("deleteUserId").value;
  if (!userId) return;

  try {
    const userDelPromise = deleteDoc(doc(db, "users", userId)).catch(() => {});
    const progDelPromise = deleteDoc(doc(db, "progress", userId)).catch(() => {});

    await Promise.all([userDelPromise, progDelPromise]);

    closeAdminModal("deleteConfirmModal");
    showToast("🗑️ Usuario eliminado de la base de datos", "success");
    await loadAdminData();

  } catch (err) {
    console.error("[Admin] Error al eliminar:", err);
    showToast("Error al eliminar de Firestore: " + err.message, "error");
  }
};

/* ── 10. EXPORTAR DATOS A CSV ── */
window.exportToCSV = function exportToCSV() {
  if (allStudents.length === 0) {
    showToast("No hay datos para exportar", "error");
    return;
  }

  const headers = ["ID", "Nombre", "Correo", "Contraseña", "Nivel", "XP", "V-Mapaches", "Racha", "Rol"];
  const rows = allStudents.map(s => [
    `"${s.id}"`,
    `"${s.name}"`,
    `"${s.email}"`,
    `"${s.password || '••••••••'}"`,
    s.level,
    s.xp,
    s.vb,
    s.streak,
    `"${s.role}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `usuarios_racoon_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("📥 Archivo CSV descargado correctamente", "success");
};

/* ── HELPERS DE MODAL Y TOAST ── */
window.openAdminModal = function openAdminModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("show");
};

window.closeAdminModal = function closeAdminModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("show");
};

function showToast(msg, type = "success") {
  const toast = document.getElementById("adminToast");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");

  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.className = `admin-toast ${type}`;
  toastIcon.textContent = type === "success" ? "✅" : "⚠️";

  toast.style.display = "flex";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ── CERRAR SESIÓN ADMIN ── */
window.handleAdminLogout = async function handleAdminLogout() {
  try {
    await signOut(auth);
    window.location.href = "landing.html";
  } catch (err) {
    window.location.href = "landing.html";
  }
};
