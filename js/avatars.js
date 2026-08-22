/* ==============================================
   AVATAR STORE CONTROLLER — js/avatars.js (v2.3)
   Tienda y equipamiento de los 9 stickers de mapache.
   ============================================== */

import { auth } from './firebase-config.js?v=2.4';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
  initXP, 
  getVB, 
  getAvatar, 
  getUnlockedAvatars, 
  buyAvatar, 
  setAvatar, 
  AVATARS, 
  getAvatarData 
} from './xp.js?v=2.4';

// Variables de estado
let currentVB = 0;
let unlockedAvatars = [];
let currentAvatarId = 'raccoon_happy';
let selectedAvatarToBuy = null;

// Elementos del DOM
const vbDisplay = document.getElementById('vbDisplay');
const equippedAvatarImg = document.getElementById('equippedAvatarImg');
const currentAvatarName = document.getElementById('currentAvatarName');
const avatarCategories = document.getElementById('avatarCategories');
const confirmModal = document.getElementById('confirmModal');
const modalAvatarImg = document.getElementById('modalAvatarImg');
const modalAvatarName = document.getElementById('modalAvatarName');
const modalAvatarPrice = document.getElementById('modalAvatarPrice');
const btnConfirmBuy = document.getElementById('btnConfirmBuy');
const btnCancelBuy = document.getElementById('btnCancelBuy');
const toast = document.getElementById('toast');

// Inicialización con Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'landing.html';
    return;
  }
  await initXP();
  renderStore();
});

function renderStore() {
  currentVB = getVB();
  unlockedAvatars = getUnlockedAvatars();
  currentAvatarId = getAvatar();

  if (vbDisplay) vbDisplay.textContent = currentVB;

  // Renderizar avatar equipado
  const activeAvatar = getAvatarData();
  if (equippedAvatarImg) equippedAvatarImg.src = activeAvatar.img;
  if (currentAvatarName) currentAvatarName.textContent = activeAvatar.name;

  // Renderizar catálogo por categorías
  if (!avatarCategories) return;
  avatarCategories.innerHTML = '';

  const categories = {
    'basic':    { name: '🌟 Básicos y Clásicos', class: 'category-basic', items: [] },
    'thematic': { name: '🎭 Temáticos y Disfraces', class: 'category-theme', items: [] },
    'special':  { name: '👑 Especiales y Legendarios', class: 'category-special', items: [] }
  };

  AVATARS.forEach(av => {
    if (categories[av.category]) {
      categories[av.category].items.push(av);
    } else {
      categories['basic'].items.push(av);
    }
  });

  for (const [_, cat] of Object.entries(categories)) {
    if (cat.items.length === 0) continue;

    const catSection = document.createElement('div');
    catSection.className = 'category-section';

    const header = document.createElement('h3');
    header.className = `category-header ${cat.class}`;
    header.textContent = cat.name;
    catSection.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'avatar-grid';

    cat.items.forEach(av => {
      const isOwned = unlockedAvatars.includes(av.id) || av.cost === 0;
      const isEquipped = av.id === currentAvatarId;
      const canAfford = currentVB >= av.cost;

      const card = document.createElement('div');
      card.className = `avatar-card ${isEquipped ? 'equipped' : ''} ${!isOwned ? 'locked' : ''}`;

      let btnHtml = '';
      if (isEquipped) {
        btnHtml = `<button class="btn-card btn-equipped" disabled>Equipado ✨</button>`;
      } else if (isOwned) {
        btnHtml = `<button class="btn-card btn-equip" onclick="handleEquip('${av.id}')">Equipar</button>`;
      } else {
        const costLabel = av.cost === 0 ? 'Gratis' : `${av.cost} 💎`;
        btnHtml = `
          <button class="btn-card btn-buy ${!canAfford ? 'disabled' : ''}" 
                  onclick="openBuyModal('${av.id}')"
                  ${!canAfford ? 'disabled' : ''}>
            Desbloquear (${costLabel})
          </button>
        `;
      }

      card.innerHTML = `
        <div class="card-img-container">
          <img src="${av.img}" alt="${av.name}" class="avatar-sticker-img" />
        </div>
        <h4 class="card-name">${av.name}</h4>
        <div class="card-price ${isOwned ? 'price-owned' : (canAfford ? 'price-affordable' : 'price-expensive')}">
          ${isEquipped ? 'En uso' : (isOwned ? 'Desbloqueado' : (av.cost === 0 ? 'Gratis' : `💎 ${av.cost}`))}
        </div>
        ${btnHtml}
      `;

      grid.appendChild(card);
    });

    catSection.appendChild(grid);
    avatarCategories.appendChild(catSection);
  }
}

// Modal de compra
window.openBuyModal = (avatarId) => {
  const av = AVATARS.find(a => a.id === avatarId);
  if (!av) return;

  selectedAvatarToBuy = av;
  if (modalAvatarImg) modalAvatarImg.src = av.img;
  if (modalAvatarName) modalAvatarName.textContent = av.name;
  if (modalAvatarPrice) modalAvatarPrice.textContent = av.cost;

  if (confirmModal) confirmModal.classList.remove('hidden');
};

window.closeBuyModal = () => {
  if (confirmModal) confirmModal.classList.add('hidden');
  selectedAvatarToBuy = null;
};

if (btnConfirmBuy) {
  btnConfirmBuy.addEventListener('click', async () => {
    if (!selectedAvatarToBuy) return;
    try {
      const res = await buyAvatar(selectedAvatarToBuy.id);
      if (res.success) {
        await setAvatar(selectedAvatarToBuy.id); // Equipar automáticamente al comprar
        window.closeBuyModal();
        showToast(res.message || `¡Has desbloqueado ${selectedAvatarToBuy.name}! 🎉`);
        renderStore();
      } else {
        alert(res.message || 'No tienes suficientes V-Mapaches.');
        window.closeBuyModal();
      }
    } catch (err) {
      console.error('[Store Error]:', err);
      window.closeBuyModal();
    }
  });
}

window.handleEquip = async (avatarId) => {
  try {
    const res = await setAvatar(avatarId);
    showToast(res.message || '¡Avatar equipado! ✨');
    renderStore();
  } catch (err) {
    console.error('[Equip Error]:', err);
  }
};

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
