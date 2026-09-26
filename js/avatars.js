// Tienda de skins: compra y equipamiento de avatares con monedas

import { auth } from './firebase-config.js?v=2.5';
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
} from './xp.js?v=2.8';

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
const toast = document.getElementById('toast');

// Registro de funciones globales para eventos de click
window.handleEquip = async (avatarId) => {
  try {
    const res = await setAvatar(avatarId);
    if (res.success) {
      showToast(res.message || '¡Skin equipada con éxito!');
      renderStore();
    } else {
      showToast(res.message || 'No se pudo equipar la skin');
    }
  } catch (err) {
    console.error('[Equip Error]:', err);
  }
};

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
        window.closeBuyModal();
        showToast(res.message || `¡Has desbloqueado ${selectedAvatarToBuy.name}!`);
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

  // Renderizar catálogo por categorías (sin emojis)
  if (!avatarCategories) return;
  avatarCategories.innerHTML = '';

  const categories = {
    'basic':    { name: 'Skins Básicas y Clásicas', class: 'category-basic', items: [] },
    'thematic': { name: 'Skins Temáticas y Disfraces', class: 'category-theme', items: [] },
    'special':  { name: 'Skins Especiales y Legendarias', class: 'category-special', items: [] }
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
        btnHtml = `<button class="btn-card btn-equipped" disabled>Equipada</button>`;
      } else if (isOwned) {
        btnHtml = `<button class="btn-card btn-equip" onclick="window.handleEquip('${av.id}')">Equipar</button>`;
      } else {
        const costLabel = av.cost === 0 ? 'Gratis' : `${av.cost} V-M`;
        btnHtml = `
          <button class="btn-card btn-buy ${!canAfford ? 'disabled' : ''}" 
                  onclick="window.openBuyModal('${av.id}')"
                  ${!canAfford ? 'disabled' : ''}>
            Desbloquear (${costLabel})
          </button>
        `;
      }

      let priceHtml = '';
      if (isEquipped) {
        priceHtml = '<span class="price-owned">En uso</span>';
      } else if (isOwned) {
        priceHtml = '<span class="price-owned">Desbloqueada</span>';
      } else if (av.cost === 0) {
        priceHtml = '<span class="price-affordable">Gratis</span>';
      } else {
        const priceClass = canAfford ? 'price-affordable' : 'price-expensive';
        priceHtml = `
          <span class="${priceClass} price-with-icon">
            <svg class="price-diamond-svg" viewBox="0 0 24 24" width="13" height="13" fill="none">
              <path d="M12 2L3 8.5L12 22L21 8.5L12 2Z" fill="#00e5ff" stroke="#7b6fff" stroke-width="1.5"/>
              <path d="M3 8.5H21M12 2L7.5 8.5L12 22L16.5 8.5L12 2Z" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.2"/>
            </svg>
            ${av.cost} V-M
          </span>
        `;
      }

      card.innerHTML = `
        <div class="card-img-container">
          <img src="${av.img}" alt="${av.name}" class="avatar-sticker-img" />
        </div>
        <h4 class="card-name">${av.name}</h4>
        <div class="card-price">
          ${priceHtml}
        </div>
        ${btnHtml}
      `;

      grid.appendChild(card);
    });

    catSection.appendChild(grid);
    avatarCategories.appendChild(catSection);
  }
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
