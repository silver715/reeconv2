import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
    initXP, 
    getVB, 
    getAvatar, 
    getUnlockedAvatars, 
    buyAvatar, 
    setAvatar, 
    AVATARS, 
    getAvatarEmoji 
} from './xp.js';

// Variables de estado
let currentVB = 0;
let unlockedAvatars = [];
let currentAvatarId = 'default';
let selectedAvatarToBuy = null;

// Elementos del DOM
const vbDisplay = document.getElementById('vbDisplay');
const currentAvatarPreview = document.getElementById('currentAvatarPreview');
const currentAvatarName = document.getElementById('currentAvatarName');
const avatarCategories = document.getElementById('avatarCategories');

const buyModal = document.getElementById('buyModal');
const modalAvatarEmoji = document.getElementById('modalAvatarEmoji');
const modalAvatarName = document.getElementById('modalAvatarName');
const modalPrice = document.getElementById('modalPrice');
const btnConfirmBuy = document.getElementById('btnConfirmBuy');
const toast = document.getElementById('toast');

// Inicialización y Guardia de Autenticación
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'landing.html';
        return;
    }
    
    // Cargar datos de XP y avatares
    await initXP();
    
    // Renderizar la tienda
    renderStore();
});

function renderStore() {
    currentVB = getVB();
    unlockedAvatars = getUnlockedAvatars();
    currentAvatarId = getAvatar();
    
    renderBalance();
    renderCurrentAvatar();
    renderAvatarGrid();
}

function renderBalance() {
    vbDisplay.textContent = currentVB;
}

function renderCurrentAvatar() {
    // Buscar datos del avatar actual
    const avatarInfo = AVATARS.find(a => a.id === currentAvatarId) || AVATARS[0];
    
    currentAvatarPreview.innerHTML = `<span class="avatar-emoji">${avatarInfo.emoji}</span>`;
    currentAvatarName.textContent = avatarInfo.name;
}

function renderAvatarGrid() {
    avatarCategories.innerHTML = '';
    
    // Agrupar avatares por categoría
    const categories = {
        'basic': { name: 'Básicos', class: 'category-basic', items: [] },
        'theme': { name: 'Temáticos', class: 'category-theme', items: [] },
        'special': { name: 'Especiales', class: 'category-special', items: [] }
    };
    
    AVATARS.forEach(avatar => {
        if (categories[avatar.category]) {
            categories[avatar.category].items.push(avatar);
        }
    });
    
    // Renderizar cada categoría
    for (const [key, cat] of Object.entries(categories)) {
        if (cat.items.length === 0) continue;
        
        const categoryHeader = document.createElement('h3');
        categoryHeader.className = `category-header ${cat.class}`;
        categoryHeader.textContent = cat.name;
        
        const grid = document.createElement('div');
        grid.className = 'avatar-grid';
        
        cat.items.forEach(avatar => {
            const isOwned = unlockedAvatars.includes(avatar.id);
            const isEquipped = avatar.id === currentAvatarId;
            const canAfford = currentVB >= avatar.price;
            
            const card = document.createElement('div');
            card.className = `avatar-card ${isEquipped ? 'equipped' : ''} ${!isOwned ? 'locked' : ''}`;
            
            // Emoji y Nombre
            let html = `
                <div class="card-emoji-container">
                    <span class="card-emoji">${avatar.emoji}</span>
                </div>
                <h4 class="card-name">${avatar.name}</h4>
            `;
            
            // Precio y Botón
            if (isEquipped) {
                html += `
                    <div class="card-price price-free">¡Tuyo!</div>
                    <button class="btn-card btn-equipped" disabled>Equipado ✨</button>
                `;
            } else if (isOwned) {
                html += `
                    <div class="card-price price-free">Desbloqueado</div>
                    <button class="btn-card btn-equip" onclick="handleEquip('${avatar.id}')">Equipar</button>
                `;
            } else {
                const priceClass = canAfford ? 'price-affordable' : 'price-expensive';
                const priceText = avatar.price === 0 ? 'Gratis' : `${avatar.price} 💎`;
                
                html += `
                    <div class="card-price ${priceClass}">${priceText}</div>
                    <button class="btn-card btn-buy" 
                            onclick="openBuyModal('${avatar.id}')" 
                            ${!canAfford ? 'disabled' : ''}>
                        Comprar
                    </button>
                `;
            }
            
            card.innerHTML = html;
            grid.appendChild(card);
        });
        
        avatarCategories.appendChild(categoryHeader);
        avatarCategories.appendChild(grid);
    }
}

// Funciones globales para onclick en el HTML
window.openBuyModal = (avatarId) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    if (!avatar) return;
    
    selectedAvatarToBuy = avatar;
    
    modalAvatarEmoji.textContent = avatar.emoji;
    modalAvatarName.textContent = avatar.name;
    modalPrice.textContent = avatar.price;
    
    buyModal.classList.remove('hidden');
};

window.closeModal = () => {
    buyModal.classList.add('hidden');
    selectedAvatarToBuy = null;
};

btnConfirmBuy.addEventListener('click', async () => {
    if (!selectedAvatarToBuy) return;
    
    try {
        const success = await buyAvatar(selectedAvatarToBuy.id);
        
        if (success) {
            window.closeModal();
            showToast(`¡Has comprado ${selectedAvatarToBuy.name}! 🎉`);
            renderStore(); // Actualizar UI
            
            // Animación en el preview actual si se equipa automáticamente
            currentAvatarPreview.classList.add('animate-success');
            setTimeout(() => {
                currentAvatarPreview.classList.remove('animate-success');
            }, 500);
        } else {
            alert('No tienes suficientes V-Mapaches o hubo un error.');
            window.closeModal();
        }
    } catch (error) {
        console.error("Error al comprar:", error);
        alert('Hubo un error al procesar la compra.');
    }
});

window.handleEquip = async (avatarId) => {
    try {
        await setAvatar(avatarId);
        showToast('¡Avatar equipado! ✨');
        renderStore();
        
        currentAvatarPreview.classList.add('animate-success');
        setTimeout(() => {
            currentAvatarPreview.classList.remove('animate-success');
        }, 500);
    } catch (error) {
        console.error("Error al equipar:", error);
    }
};

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
