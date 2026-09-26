// Pase de batalla: progreso por niveles y recompensas de monedas

import { auth } from './firebase-config.js?v=2.3';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initXP, getXP, getLvl, getVB, REWARDS, XP_PER_LVL } from './xp.js?v=2.9';

// Requiere sesión: verificamos con Firebase antes de mostrar el pase
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'landing.html';
    return;
  }
  await initXP();
  init();
});

function init() {
  renderStats();
  renderXPBar();
  renderGrid(REWARDS, 'grid1');
}

// Barra de XP (Conserva el progreso exacto)
function renderXPBar() {
  const xp  = getXP();
  const lvl = getLvl();
  const pct = Math.min(100, Math.round((xp / XP_PER_LVL) * 100));
  const rem = XP_PER_LVL - xp;

  const lvlBadge = document.getElementById('lvlBadge');
  const xpFill   = document.getElementById('xpFill');
  const xpNums   = document.getElementById('xpNums');
  const xpHint   = document.getElementById('xpHint');
  const vbDisp   = document.getElementById('vbDisplay');

  if (lvlBadge) lvlBadge.textContent = 'NIV ' + lvl;
  if (xpFill)   xpFill.style.width   = pct + '%';
  if (xpNums)   xpNums.textContent   = xp.toLocaleString() + ' / ' + XP_PER_LVL.toLocaleString() + ' XP';
  if (xpHint) {
    xpHint.textContent = rem > 0
      ? `Faltan ${rem.toLocaleString()} XP para alcanzar el Nivel ${lvl + 1}`
      : '¡Nivel máximo alcanzado!';
  }
  if (vbDisp) vbDisp.textContent = getVB().toLocaleString();
}

// Estadísticas Unificadas (Sin VIP)
function renderStats() {
  const lvl = getLvl();
  const unlockedRewards = REWARDS.filter(r => r.lvl <= lvl);
  const totalCoinsEarned = unlockedRewards.reduce((sum, r) => sum + (r.coins || 0), 0);

  const elLvl = document.getElementById('statLvl');
  const elClaimed = document.getElementById('statClaimed');
  const elCoins = document.getElementById('statTotalCoins');

  if (elLvl) elLvl.textContent = lvl;
  if (elClaimed) elClaimed.textContent = `${unlockedRewards.length} / ${REWARDS.length}`;
  if (elCoins) elCoins.textContent = `+${totalCoinsEarned.toLocaleString()}`;
}

// Renderizar grilla de recompensas (5 a 20 Monedas Mapache)
const rarityBg = {
  common:    'rar-common',
  uncommon:  'rar-uncommon',
  rare:      'rar-rare',
  epic:      'rar-epic',
  legendary: 'rar-legendary',
};

function renderGrid(items, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  const lvl = getLvl();

  items.forEach(r => {
    const unlocked  = r.lvl <= lvl;
    const isCurrent = r.lvl === lvl;

    const slot = document.createElement('div');
    slot.className = [
      'rslot',
      unlocked ? 'unlocked' : 'locked',
      isCurrent  ? 'is-current' : '',
    ].filter(Boolean).join(' ');

    slot.innerHTML = `
      <div class="rslot-top ${rarityBg[r.rarity] || 'rar-common'}">
        <div class="coin-badge-glow">
          <svg class="rslot-diamond-svg" viewBox="0 0 24 24" width="40" height="40" fill="none">
            <path d="M12 2L3 8.5L12 22L21 8.5L12 2Z" fill="url(#diamGrad)" stroke="#7b6fff" stroke-width="1.2"/>
            <path d="M3 8.5H21M12 2L7.5 8.5L12 22L16.5 8.5L12 2Z" stroke="#ffffff" stroke-opacity="0.75" stroke-width="1.2"/>
            <defs>
              <linearGradient id="diamGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stop-color="#00e5ff"/>
                <stop offset="1" stop-color="#7b6fff"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div class="rslot-bot">
        <div class="rslot-lvl">Nivel ${r.lvl}</div>
        <div class="rslot-name">+${r.coins} V-M</div>
        <div class="rslot-status ${unlocked ? 'status-unlocked' : 'status-locked'}">
          ${unlocked ? '✓ Desbloqueado' : 'Bloqueado'}
        </div>
      </div>
      ${unlocked ? '<div class="rslot-check">✓</div>' : ''}
    `;
    grid.appendChild(slot);
  });
}
