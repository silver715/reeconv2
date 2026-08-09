import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Elementos del DOM
const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('leaderboard-content');
const emptyStateEl = document.getElementById('empty-state');
const podiumEl = document.getElementById('podium');
const rankingBodyEl = document.getElementById('ranking-body');

// Guard de Autenticación
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'landing.html';
        return;
    }
    
    await loadLeaderboard(user.uid);
});

const AVATAR_EMOJIS = {
  'raccoon_default': '🦝',
  'raccoon_scientist': '🔬',
  'raccoon_artist': '🎨',
  'raccoon_musician': '🎵',
  'raccoon_astronaut': '🚀',
  'raccoon_ninja': '🥷',
  'raccoon_chef': '👨‍🍳',
  'raccoon_pirate': '🏴‍☠️',
  'raccoon_golden': '👑',
  'raccoon_robot': '🤖',
};

async function loadLeaderboard(currentUserId) {
    try {
        // Obtener todos los usuarios
        const usersMap = {};
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          usersSnapshot.forEach(doc => {
              usersMap[doc.id] = doc.data().name || 'Estudiante';
          });
        } catch (uErr) {
          console.warn("Firestore users query warning:", uErr.message);
        }

        // Obtener todo el progreso
        const progressSnapshot = await getDocs(collection(db, 'progress'));
        const players = [];

        progressSnapshot.forEach(doc => {
            const data = doc.data();
            const level = data.lvl || data.level || 1;
            const xp = data.xp || 0;
            const totalXp = (level - 1) * 1000 + xp;
            
            let avatarEmoji = AVATAR_EMOJIS[data.avatar] || data.avatarEmoji || '🦝';

            players.push({
                userId: doc.id,
                name: usersMap[doc.id] || (doc.id === currentUserId ? 'Tú' : 'Estudiante'),
                level: level,
                xp: xp,
                totalXp: totalXp,
                avatarEmoji: avatarEmoji
            });
        });

        if (players.length === 0) {
            loadingEl.style.display = 'none';
            if (emptyStateEl) emptyStateEl.style.display = 'block';
            contentEl.style.display = 'block';
            contentEl.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text2);">
              <span style="font-size:48px; display:block; margin-bottom:12px;">🏆</span>
              <h3 style="font-family:'Baloo 2',cursive; font-size:1.4rem; color:var(--text);">¡Sé el primero en el Ranking!</h3>
              <p>Responde preguntas en el chat o completa quizzes para subir de nivel y aparecer aquí.</p>
            </div>`;
            return;
        }

        // Ordenar: Nivel Descendente, luego XP Descendente
        players.sort((a, b) => {
            if (b.level !== a.level) {
                return b.level - a.level;
            }
            return b.xp - a.xp;
        });

        renderLeaderboard(players, currentUserId);
        
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
        
    } catch (error) {
        console.warn("Firestore progress query warning (Ranking):", error.message);
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
        contentEl.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text2);">
          <span style="font-size:48px; display:block; margin-bottom:12px;">🏆</span>
          <h3 style="font-family:'Baloo 2',cursive; font-size:1.4rem; color:var(--text);">Ranking de Estudiantes</h3>
          <p>Para ver el ranking de todos los usuarios en la nube, recuerda publicar las <code>firestore.rules</code> en Firebase Console.</p>
        </div>`;
    }
}

function renderLeaderboard(players, currentUserId) {
    // 1. Renderizar Podio (Top 3)
    const top3 = players.slice(0, 3);
    
    // Orden para el podio visual: 2do, 1ro, 3ro
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

    // 2. Renderizar Tabla Completa
    rankingBodyEl.innerHTML = players.map((player, index) => {
        const pos = index + 1;
        const isCurrent = player.userId === currentUserId;
        const rowClass = isCurrent ? 'ranking-row current-user' : 'ranking-row';
        const posClass = pos <= 3 ? `pos-${pos}` : '';
        const delay = Math.min(index * 0.05, 1); // máximo 1s de retraso
        
        return `
            <tr class="${rowClass}" style="animation-delay: ${delay}s">
                <td class="pos-col ${posClass}">${pos}</td>
                <td class="avatar-col">${player.avatarEmoji}</td>
                <td class="name-col">${player.name} ${isCurrent ? '(Tú)' : ''}</td>
                <td class="level-col">${player.level}</td>
                <td class="xp-col">${player.totalXp} XP</td>
            </tr>
        `;
    }).join('');
}

function getAvatarEmojiFallback(avatarId) {
    const avatars = {
        'default': '🦊',
        'owl': '🦉',
        'cat': '🐱',
        'dog': '🐶',
        'panda': '🐼',
        'lion': '🦁',
        'tiger': '🐯',
        'bear': '🐻'
    };
    return avatars[avatarId] || '🦊';
}
