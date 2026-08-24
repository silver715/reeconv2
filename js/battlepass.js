/* ==============================
   BATTLE PASS — js/battlepass.js
   ============================== */

import { auth } from './firebase-config.js?v=2.3';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initXP, getXP, getLvl, getVB, REWARDS, XP_PER_LVL } from './xp.js?v=2.8';

let currentTab = 'all';

/* ─── Requiere sesión: verificamos con Firebase antes de mostrar el pase ─── */
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
  renderTab('all');
}

/* ─── Barra de XP ─── */
function renderXPBar() {
  const xp  = getXP();
  const lvl = getLvl();
  const pct = Math.round((xp / XP_PER_LVL) * 100);
  const rem = XP_PER_LVL - xp;

  document.getElementById('lvlBadge').textContent = 'NIV ' + lvl;
  document.getElementById('xpFill').style.width   = pct + '%';
  document.getElementById('xpNums').textContent   = xp.toLocaleString() + ' / ' + XP_PER_LVL.toLocaleString();
  document.getElementById('xpHint').textContent   = rem > 0
    ? rem.toLocaleString() + ' XP para nivel ' + (lvl + 1)
    : '¡Nivel máximo alcanzado!';
  document.getElementById('vbDisplay').textContent = getVB().toLocaleString();
}

/* ─── Estadísticas ─── */
function renderStats() {
  const lvl = getLvl();
  const freeUnlocked    = REWARDS.filter(r => !r.premium && r.lvl <= lvl).length;
  const premiumUnlocked = REWARDS.filter(r =>  r.premium && r.lvl <= lvl).length;
  const vbEarned        = REWARDS.filter(r => r.type === 'vbucks' && !r.premium && r.lvl <= lvl).length * 100;

  document.getElementById('statFree').textContent = freeUnlocked;
  document.getElementById('statPrem').textContent = premiumUnlocked;
  document.getElementById('statVB').textContent   = vbEarned;
}

/* ─── Tabs (el HTML llama switchTab(...) por onclick, así que debe ser global) ─── */
window.switchTab = function switchTab(tab, el) {
  currentTab = tab;
  document.querySelectorAll('.bp-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderTab(tab);
};

function renderTab(tab) {
  let filtered = REWARDS;
  if (tab === 'free')    filtered = REWARDS.filter(r => !r.premium);
  if (tab === 'premium') filtered = REWARDS.filter(r =>  r.premium);

  const half = Math.ceil(filtered.length / 2);
  renderGrid(filtered.slice(0, half),    'grid1');
  renderGrid(filtered.slice(half),       'grid2');

  const p2 = document.getElementById('page2Label');
  if (p2) p2.style.display = filtered.slice(half).length ? '' : 'none';
}

/* ─── Renderizar grilla ─── */
const rarityBg = {
  common:    'rar-common',
  uncommon:  'rar-uncommon',
  rare:      'rar-rare',
  epic:      'rar-epic',
  legendary: 'rar-legendary',
};
const typeClass = { skin:'t-skin', vbucks:'t-vbucks', emote:'t-emote', item:'t-item' };
const typeName  = { skin:'Skin',   vbucks:'V-M',       emote:'Emote',   item:'Objeto' };

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
      r.premium  ? 'is-premium' : '',
    ].filter(Boolean).join(' ');

    slot.innerHTML = `
      <div class="rslot-top ${rarityBg[r.rarity]}">${r.icon}</div>
      <div class="rslot-bot">
        <div class="rslot-name">${r.name}</div>
        <div class="rslot-lvl">Niv ${r.lvl}</div>
        <div class="rslot-type ${typeClass[r.type]}">${typeName[r.type]}</div>
      </div>
      <div class="rslot-badge ${r.premium ? 'badge-prem' : 'badge-free'}">${r.premium ? 'PRO' : 'FREE'}</div>
      ${unlocked ? '<div class="rslot-check">✓</div>' : ''}
    `;
    grid.appendChild(slot);
  });
}
