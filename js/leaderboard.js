// Tabla de clasificación: ranking de estudiantes por nivel y experiencia

import { auth, db } from './firebase-config.js?v=2.1';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Guard de Autenticación
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true';

if (isDemoMode) {
  setTimeout(() => {
    loadLeaderboard({ uid: 'mock_vasquez', displayName: 'vasquez', email: 'vasquez@test.com' }, true);
  }, 100);
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'landing.html';
      return;
    }
    await loadLeaderboard(user, false);
  });
}

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

async function loadLeaderboard(currentUser, isMock = false) {
  const currentUserId = currentUser ? currentUser.uid : 'mock_vasquez';
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('leaderboard-content');
  const podiumEl = document.getElementById('podium');
  const rankingBodyEl = document.getElementById('leaderboard-body') || document.getElementById('ranking-body');

  const usersMap = {};
  const players = [];

  if (isMock) {
    players.push(
      { userId: 'u1', name: 'vasquez2', level: 20, xp: 0, totalXp: 19000, avatarImg: 'img/avatars/raccoon_happy.png' },
      { userId: 'u2', name: 'daniel', level: 2, xp: 600, totalXp: 1600, avatarImg: 'img/avatars/raccoon_knife.png' },
      { userId: 'mock_vasquez', name: 'vasquez', level: 1, xp: 150, totalXp: 150, avatarImg: 'img/avatars/raccoon_happy.png' },
      { userId: 'u4', name: 'jose', level: 1, xp: 0, totalXp: 0, avatarImg: 'img/avatars/raccoon_happy.png' },
      { userId: 'u5', name: 'valencia', level: 1, xp: 0, totalXp: 0, avatarImg: 'img/avatars/raccoon_happy.png' }
    );
  } else {
    // 1. Cargar perfiles de usuarios desde la colección 'users'
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach((docSnap) => {
        const uData = docSnap.data();
        const resolvedName = uData.name || (uData.email ? uData.email.split('@')[0] : null);
        if (resolvedName) {
          usersMap[docSnap.id] = resolvedName;
        }
      });
    } catch (uErr) {
      console.warn('[Leaderboard] Advertencia al leer usuarios:', uErr.message);
    }

    // Asegurar el nombre del usuario actual si tiene displayName en Auth
    if (currentUser && !usersMap[currentUserId] && currentUser.displayName) {
      usersMap[currentUserId] = currentUser.displayName;
    }

    // 2. Cargar progreso de todos los usuarios
    try {
      const progressSnapshot = await getDocs(collection(db, 'progress'));
      progressSnapshot.forEach((docSnap) => {
        const pData = docSnap.data();
        const level = pData.lvl || pData.level || 1;
        const xp = pData.xp || 0;
        const totalXp = (level - 1) * 1000 + xp;
        const avatarKey = pData.avatar || 'raccoon_happy';
        const avatarImg = AVATAR_IMAGES[avatarKey] || AVATAR_IMAGES['raccoon_happy'];

        // Obtener el nombre más descriptivo posible
        let displayName = usersMap[docSnap.id];
        if (!displayName) {
          if (docSnap.id === currentUserId && currentUser) {
            displayName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Estudiante');
          } else {
            // Si es un usuario de prueba antiguo sin documento de perfil
            displayName = `Estudiante ${docSnap.id.slice(0, 4)}`;
          }
        }

        players.push({
          userId: docSnap.id,
          name: displayName,
          level: level,
          xp: xp,
          totalXp: totalXp,
          avatarImg: avatarImg
        });
      });
    } catch (pErr) {
      console.warn('[Leaderboard] Advertencia al leer progreso:', pErr.message);
    }
  }

  // Ocultar spinner y mostrar contenedor
  if (loadingEl) loadingEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'block';

  // Si no hay jugadores aún
  if (players.length === 0) {
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text2);">
          <span style="font-size:48px; display:block; margin-bottom:12px;">🏆</span>
          <h3 style="font-family:'Baloo 2',cursive; font-size:1.4rem; color:var(--text);">¡Sé el primero en el Ranking!</h3>
          <p>Responde preguntas en el chat o completa quizzes para subir de nivel y aparecer aquí.</p>
        </div>`;
    }
    return;
  }

  // 3. Ordenar: Mayor Nivel primero, luego Mayor XP como desempate
  players.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.xp - a.xp;
  });

  // 4. Renderizar Podio (Top 3)
  if (podiumEl) {
    const top3 = players.slice(0, 3);
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push({ ...top3[1], pos: 2, class: 'second', medal: '🥈', label: '2° PLATA' });
    if (top3[0]) podiumOrder.push({ ...top3[0], pos: 1, class: 'first', medal: '🥇', label: '1° ORO' });
    if (top3[2]) podiumOrder.push({ ...top3[2], pos: 3, class: 'third', medal: '🥉', label: '3° BRONCE' });

    podiumEl.innerHTML = podiumOrder.map(player => {
      const isCurrent = player.userId === currentUserId;
      const rawName = player.name ? String(player.name).trim() : '';
      const cleanName = rawName || (isCurrent ? 'Tú' : `Estudiante #${player.pos}`);
      const crownHtml = player.pos === 1 ? '<div class="podium-crown" title="¡Campeón de la Temporada!">👑</div>' : '';
      const youBadgeHtml = isCurrent ? '<span class="podium-you-pill">¡Tú! ⭐</span>' : '';

      return `
        <div class="podium-item ${player.class} ${isCurrent ? 'current-player' : ''}">
          ${crownHtml}
          <div class="podium-avatar">
            <img src="${player.avatarImg}" alt="Avatar" />
          </div>
          <div class="podium-name" title="${cleanName}">${cleanName}</div>
          ${youBadgeHtml}
          <div class="podium-medal">${player.medal}</div>
          <div class="podium-rank-pill ${player.class}">${player.label}</div>
          <div class="podium-level">Lvl ${player.level} <span class="podium-xp-sub">• ${player.totalXp} XP</span></div>
        </div>
      `;
    }).join('');
  }

  // 5. Renderizar Tabla Completa
  if (rankingBodyEl) {
    rankingBodyEl.innerHTML = players.map((player, index) => {
      const pos = index + 1;
      const isCurrent = player.userId === currentUserId;
      const rowClass = isCurrent ? 'ranking-row current-user' : 'ranking-row';
      const posClass = pos <= 3 ? `pos-${pos}` : '';
      const delay = Math.min(index * 0.05, 0.8);

      return `
        <tr class="${rowClass}" style="animation-delay: ${delay}s">
          <td class="pos-col ${posClass}">${pos}</td>
          <td class="name-col">
            <span class="avatar-icon" style="display:inline-flex; align-items:center; vertical-align:middle; margin-right:8px;">
              <img src="${player.avatarImg}" alt="Avatar" style="width:28px; height:28px; object-fit:contain;" />
            </span>
            ${player.name} ${isCurrent ? '<strong style="color:var(--gold); margin-left:6px;">(Tú)</strong>' : ''}
          </td>
          <td class="level-col">Nivel ${player.level}</td>
          <td class="xp-col">${player.totalXp} XP</td>
        </tr>
      `;
    }).join('');
  }
}
