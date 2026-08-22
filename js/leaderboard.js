/* ==============================================
   LEADERBOARD CONTROLLER — js/leaderboard.js (v2.1)
   Carga y renderiza el ranking de estudiantes desde Firestore.
   ============================================== */

import { auth, db } from './firebase-config.js?v=2.1';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Guard de Autenticación
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'landing.html';
    return;
  }
  await loadLeaderboard(user.uid);
});

const AVATAR_EMOJIS = {
  'raccoon_default':   '🦝',
  'raccoon_scientist': '🔬',
  'raccoon_artist':    '🎨',
  'raccoon_musician':  '🎵',
  'raccoon_astronaut': '🚀',
  'raccoon_ninja':     '🥷',
  'raccoon_chef':      '👨‍🍳',
  'raccoon_pirate':    '🏴‍☠️',
  'raccoon_golden':    '👑',
  'raccoon_robot':     '🤖',
};

async function loadLeaderboard(currentUserId) {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('leaderboard-content');
  const podiumEl = document.getElementById('podium');
  const rankingBodyEl = document.getElementById('leaderboard-body') || document.getElementById('ranking-body');

  const usersMap = {};
  const players = [];

  // 1. Cargar perfiles de usuarios
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    usersSnapshot.forEach((docSnap) => {
      const uData = docSnap.data();
      usersMap[docSnap.id] = uData.name || uData.username || 'Estudiante';
    });
  } catch (uErr) {
    console.warn('[Leaderboard] Advertencia al leer usuarios:', uErr.message);
  }

  // 2. Cargar progreso de todos los usuarios
  try {
    const progressSnapshot = await getDocs(collection(db, 'progress'));
    progressSnapshot.forEach((docSnap) => {
      const pData = docSnap.data();
      const level = pData.lvl || pData.level || 1;
      const xp = pData.xp || 0;
      const totalXp = (level - 1) * 1000 + xp;
      const avatarKey = pData.avatar || 'raccoon_default';
      const avatarEmoji = AVATAR_EMOJIS[avatarKey] || '🦝';

      players.push({
        userId: docSnap.id,
        name: usersMap[docSnap.id] || (docSnap.id === currentUserId ? 'Tú' : 'Estudiante'),
        level: level,
        xp: xp,
        totalXp: totalXp,
        avatarEmoji: avatarEmoji
      });
    });
  } catch (pErr) {
    console.warn('[Leaderboard] Advertencia al leer progreso:', pErr.message);
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
    if (top3[1]) podiumOrder.push({ ...top3[1], pos: 2, class: 'second', medal: '🥈' });
    if (top3[0]) podiumOrder.push({ ...top3[0], pos: 1, class: 'first', medal: '🥇' });
    if (top3[2]) podiumOrder.push({ ...top3[2], pos: 3, class: 'third', medal: '🥉' });

    podiumEl.innerHTML = podiumOrder.map(player => `
      <div class="podium-item ${player.class}">
        <div class="podium-avatar">${player.avatarEmoji}</div>
        <div class="podium-name">${player.name}</div>
        <div class="podium-medal">${player.medal}</div>
        <div class="podium-level">Lvl ${player.level}</div>
      </div>
    `).join('');
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
          <td class="name-col"><span class="avatar-icon">${player.avatarEmoji}</span> ${player.name} ${isCurrent ? '<strong>(Tú)</strong>' : ''}</td>
          <td class="level-col">Nivel ${player.level}</td>
          <td class="xp-col">${player.totalXp} XP</td>
        </tr>
      `;
    }).join('');
  }
}
