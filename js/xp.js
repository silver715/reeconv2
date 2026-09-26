// Sistema de progresión: cálculo de experiencia, niveles y economía de monedas

import { auth, db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, deleteField, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Constantes de configuración
export const XP_PER_LVL = 1000;  // XP necesaria para subir de nivel
export const MAX_LEVEL  = 100;   // Nivel máximo alcanzable

// Caché en memoria (se sincroniza con Firestore)
let _cache = {
  xp: 0,           // XP actual dentro del nivel
  lvl: 1,          // Nivel actual
  vb: 0,           // V-Mapaches (moneda virtual)
  streak: 0,       // Racha de días consecutivos
  lastActiveDate: null, // Última fecha activa (formato "YYYY-MM-DD")
  avatar: 'raccoon_default', // Avatar activo
  unlockedAvatars: ['raccoon_default'] // Avatares desbloqueados
};
let _ready = false;

// Catálogo de avatares disponibles (Stickers Mapache) Precio: Básico = 0-100, Temático = 200, Especial = 500 V-Mapaches
export const AVATARS = [
  { id: 'raccoon_happy',    name: 'Mapache Feliz',     img: 'img/avatars/raccoon_happy.png',    emoji: '✨', cost: 0,   category: 'basic'   },
  { id: 'raccoon_sleepy',   name: 'Mapache Dormilón',  img: 'img/avatars/raccoon_sleepy.png',   emoji: '💤', cost: 0,   category: 'basic'   },
  { id: 'raccoon_knife',    name: 'Mapache Fiero',     img: 'img/avatars/raccoon_knife.png',    emoji: '🔪', cost: 100, category: 'basic'   },
  { id: 'raccoon_sad',      name: 'Mapache Llorón',    img: 'img/avatars/raccoon_sad.png',      emoji: '😢', cost: 100, category: 'basic'   },
  { id: 'raccoon_trashcan', name: 'Mapache Basurero',  img: 'img/avatars/raccoon_trashcan.png', emoji: '🗑️', cost: 200, category: 'thematic'},
  { id: 'raccoon_ghost',    name: 'Mapache Fantasma',  img: 'img/avatars/raccoon_ghost.png',    emoji: '👻', cost: 200, category: 'thematic'},
  { id: 'raccoon_bandaid',  name: 'Mapache Valiente',  img: 'img/avatars/raccoon_bandaid.png',  emoji: '🩹', cost: 200, category: 'thematic'},
  { id: 'raccoon_skeleton', name: 'Mapache Calavera',  img: 'img/avatars/raccoon_skeleton.png', emoji: '💀', cost: 500, category: 'special' },
  { id: 'raccoon_melt',     name: 'Mapache Derretido', img: 'img/avatars/raccoon_melt.png',     emoji: '🫠', cost: 500, category: 'special' },
];

// Inicialización: cargar datos desde Firestore Debe llamarse (con await) una sola vez, después de confirmar el login
export async function initXP() {
  const user = auth.currentUser;
  if (!user) {
    _ready = true;
    return;
  }

  try {
    const ref  = doc(db, 'progress', user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      // Si existe el campo viejo coins, lo eliminamos de Firestore
      if (data.coins !== undefined) {
        updateDoc(ref, { coins: deleteField() }).catch(() => {});
      }

      // Carga limpia de progreso — Única moneda: vb
      _cache = {
        xp:              data.xp ?? 0,
        lvl:             data.lvl ?? 1,
        vb:              data.vb ?? 100,
        streak:          data.streak ?? 1,
        lastActiveDate:  data.lastActiveDate ?? new Date().toISOString().split('T')[0],
        avatar:          data.avatar ?? 'raccoon_happy',
        unlockedAvatars: data.unlockedAvatars ?? ['raccoon_happy', 'raccoon_default']
      };
    } else {
      // Primera vez del usuario: crear documento con valores iniciales
      _cache = {
        xp: 0,
        lvl: 1,
        vb: 100,
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        avatar: 'raccoon_happy',
        unlockedAvatars: ['raccoon_happy', 'raccoon_default']
      };
      await setDoc(ref, _cache).catch(err => console.warn('Firestore setDoc warning:', err.message));
    }
  } catch (err) {
    console.warn('Firestore progress load warning (usando caché local):', err.message);
  } finally {
    _ready = true;
  }
}

// Verificación de estado
function assertReady() {
  if (!_ready) {
    console.warn('XP system no estaba listo; forzando ready = true');
    _ready = true;
  }
}

// Persistir cambios en Firestore en segundo plano (No Bloqueante)
function persistAsync() {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, 'progress', user.uid);

  // Sobrescribe el documento con la estructura limpia
  setDoc(ref, _cache).catch(() => {});
}

// Getters (lectura desde caché en memoria, sin latencia)
export function getXP()              { assertReady(); return _cache.xp; }
export function getLvl()             { assertReady(); return _cache.lvl; }
export function getVB()              { assertReady(); return _cache.vb; }
export function getStreak()          { assertReady(); return _cache.streak; }
export function getAvatar()          { assertReady(); return _cache.avatar; }
export function getUnlockedAvatars() { assertReady(); return _cache.unlockedAvatars; }

// Sistema de racha diaria Compara la fecha actual con lastActiveDate para determinar si la racha continúa, se reinicia, o ya fue contada hoy. Retorna { streak, isNewDay, bonus }
export async function checkStreak() {
  assertReady();
  const hoy = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const ultimo = _cache.lastActiveDate;

  if (ultimo === hoy) {
    // Ya entró hoy, no cambia la racha
    return { streak: _cache.streak, isNewDay: false, bonus: getStreakBonus() };
  }

  if (ultimo) {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];

    if (ultimo === ayerStr) {
      // Día consecutivo: incrementar racha
      _cache.streak += 1;
    } else {
      // Se saltó uno o más días: reiniciar racha
      _cache.streak = 1;
    }
  } else {
    // Primera vez: iniciar racha en 1
    _cache.streak = 1;
  }

  _cache.lastActiveDate = hoy;
  persistAsync();
  return { streak: _cache.streak, isNewDay: true, bonus: getStreakBonus() };
}

// Bonus XP por racha 3+ días consecutivos: +50 XP extra por mensaje 7+ días consecutivos: +100 XP extra por mensaje
export function getStreakBonus() {
  if (_cache.streak >= 7) return 100;
  if (_cache.streak >= 3) return 50;
  return 0;
}

// Añadir XP (Respuesta instantánea 0ms)
export async function addXP(amount) {
  assertReady();

  // Actualizar caché local primero (respuesta instantánea en la UI)
  let xp  = _cache.xp + amount;
  let lvl = _cache.lvl;
  let leveled = false;

  while (xp >= XP_PER_LVL && lvl < MAX_LEVEL) {
    xp  -= XP_PER_LVL;
    lvl += 1;
    leveled = true;

    // Bonus V-Mapaches al subir de nivel según el pase de batalla (20 a 100 V-Mapaches)
    const reward = REWARDS.find(r => r.lvl === lvl);
    if (reward && reward.coins) {
      _cache.vb += reward.coins;
    }
  }

  _cache.xp  = xp;
  _cache.lvl = lvl;

  // Persistir en segundo plano (asíncrono, no bloqueante)
  persistAsync();

  return { xp: _cache.xp, lvl: _cache.lvl, leveled };
}

// Sistema de avatares / skins

// Comprar un avatar / skin con V-Mapaches Verifica que el usuario tenga suficientes V-Mapaches y que no lo tenga ya. Retorna { success, message }
export async function buyAvatar(avatarId) {
  assertReady();
  const avatar = AVATARS.find(a => a.id === avatarId);
  if (!avatar) return { success: false, message: 'Skin no encontrada' };

  if (_cache.unlockedAvatars.includes(avatarId)) {
    return { success: false, message: 'Ya tienes esta skin desbloqueada' };
  }

  if (_cache.vb < avatar.cost) {
    return { success: false, message: `Necesitas ${avatar.cost} V-Mapaches (tienes ${_cache.vb})` };
  }

  // Descontar V-Mapaches y registrar avatar
  _cache.vb -= avatar.cost;
  if (!_cache.unlockedAvatars.includes(avatarId)) {
    _cache.unlockedAvatars.push(avatarId);
  }
  _cache.avatar = avatarId;
  persistAsync();

  return { success: true, message: `¡${avatar.name} desbloqueada y equipada!` };
}

/* Equipar una skin ya desbloqueada.
   Retorna { success, message } */
export async function setAvatar(avatarId) {
  assertReady();
  const avatar = AVATARS.find(a => a.id === avatarId);
  if (!avatar) return { success: false, message: 'Skin no encontrada' };

  const isFree = avatar.cost === 0;
  if (!isFree && !_cache.unlockedAvatars.includes(avatarId)) {
    return { success: false, message: 'No tienes esta skin desbloqueada' };
  }

  if (!_cache.unlockedAvatars.includes(avatarId)) {
    _cache.unlockedAvatars.push(avatarId);
  }

  _cache.avatar = avatarId;
  persistAsync();
  return { success: true, message: '¡Skin equipada con éxito!' };
}

/* Obtener el emoji del avatar activo */
export function getAvatarEmoji() {
  assertReady();
  const avatar = AVATARS.find(a => a.id === _cache.avatar);
  return avatar ? avatar.emoji : '🦝';
}

/* Obtener la ruta de la imagen PNG del avatar activo */
export function getAvatarImg() {
  assertReady();
  const avatar = AVATARS.find(a => a.id === _cache.avatar);
  return avatar ? avatar.img : 'img/avatars/raccoon_happy.png';
}

/* Obtener el objeto completo del avatar activo */
export function getAvatarData() {
  assertReady();
  const avatar = AVATARS.find(a => a.id === _cache.avatar);
  return avatar || AVATARS[0];
}

// Datos de recompensas del Pase de Batalla Recompensas estándar de 20 a 100 V-Mapaches distribuidas entre los 100 niveles. Pase unificado para todos los estudiantes (sin modo VIP).
export const REWARDS = [
  { lvl: 1,   name: '+20 V-Mapaches',  coins: 20,  type: 'vbucks', rarity: 'common' },
  { lvl: 2,   name: '+20 V-Mapaches',  coins: 20,  type: 'vbucks', rarity: 'common' },
  { lvl: 4,   name: '+25 V-Mapaches',  coins: 25,  type: 'vbucks', rarity: 'uncommon' },
  { lvl: 6,   name: '+25 V-Mapaches',  coins: 25,  type: 'vbucks', rarity: 'common' },
  { lvl: 8,   name: '+30 V-Mapaches',  coins: 30,  type: 'vbucks', rarity: 'uncommon' },
  { lvl: 10,  name: '+40 V-Mapaches',  coins: 40,  type: 'vbucks', rarity: 'rare' },
  { lvl: 12,  name: '+30 V-Mapaches',  coins: 30,  type: 'vbucks', rarity: 'uncommon' },
  { lvl: 15,  name: '+50 V-Mapaches',  coins: 50,  type: 'vbucks', rarity: 'rare' },
  { lvl: 18,  name: '+40 V-Mapaches',  coins: 40,  type: 'vbucks', rarity: 'uncommon' },
  { lvl: 20,  name: '+60 V-Mapaches',  coins: 60,  type: 'vbucks', rarity: 'epic' },
  { lvl: 24,  name: '+40 V-Mapaches',  coins: 40,  type: 'vbucks', rarity: 'uncommon' },
  { lvl: 28,  name: '+50 V-Mapaches',  coins: 50,  type: 'vbucks', rarity: 'rare' },
  { lvl: 32,  name: '+50 V-Mapaches',  coins: 50,  type: 'vbucks', rarity: 'uncommon' },
  { lvl: 36,  name: '+60 V-Mapaches',  coins: 60,  type: 'vbucks', rarity: 'rare' },
  { lvl: 40,  name: '+75 V-Mapaches',  coins: 75,  type: 'vbucks', rarity: 'epic' },
  { lvl: 45,  name: '+60 V-Mapaches',  coins: 60,  type: 'vbucks', rarity: 'rare' },
  { lvl: 50,  name: '+80 V-Mapaches',  coins: 80,  type: 'vbucks', rarity: 'epic' },
  { lvl: 55,  name: '+70 V-Mapaches',  coins: 70,  type: 'vbucks', rarity: 'rare' },
  { lvl: 60,  name: '+80 V-Mapaches',  coins: 80,  type: 'vbucks', rarity: 'epic' },
  { lvl: 65,  name: '+75 V-Mapaches',  coins: 75,  type: 'vbucks', rarity: 'rare' },
  { lvl: 70,  name: '+90 V-Mapaches',  coins: 90,  type: 'vbucks', rarity: 'epic' },
  { lvl: 75,  name: '+80 V-Mapaches',  coins: 80,  type: 'vbucks', rarity: 'rare' },
  { lvl: 80,  name: '+90 V-Mapaches',  coins: 90,  type: 'vbucks', rarity: 'epic' },
  { lvl: 85,  name: '+85 V-Mapaches',  coins: 85,  type: 'vbucks', rarity: 'rare' },
  { lvl: 90,  name: '+100 V-Mapaches', coins: 100, type: 'vbucks', rarity: 'epic' },
  { lvl: 95,  name: '+100 V-Mapaches', coins: 100, type: 'vbucks', rarity: 'epic' },
  { lvl: 100, name: '+100 V-Mapaches', coins: 100, type: 'vbucks', rarity: 'legendary' },
];
