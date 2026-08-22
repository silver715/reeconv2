/* ==============================
   XP SYSTEM — js/xp.js
   Sistema de progresión con XP, niveles, V-Mapaches,
   racha diaria y avatares.
   Guardado en Firestore con caché en memoria para respuesta instantánea.
   Compartido entre chat.js, battlepass.js, quiz.js y avatars.js
   ============================== */

import { auth, db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ── Constantes de configuración ── */
export const XP_PER_LVL = 1000;  // XP necesaria para subir de nivel
export const MAX_LEVEL  = 100;   // Nivel máximo alcanzable

/* ── Caché en memoria (se sincroniza con Firestore) ── */
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

/* ── Catálogo de avatares disponibles (Stickers Mapache) ──
   Precio: Básico = 0-100, Temático = 200, Especial = 500 V-Mapaches */
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

/* ── Inicialización: cargar datos desde Firestore ──
   Debe llamarse (con await) una sola vez, después de confirmar el login */
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
      // Mezclar datos existentes con campos nuevos (migración suave)
      _cache = {
        xp:              data.xp ?? 0,
        lvl:             data.lvl ?? 1,
        vb:              data.vb ?? 0,
        streak:          data.streak ?? 0,
        lastActiveDate:  data.lastActiveDate ?? null,
        avatar:          data.avatar ?? 'raccoon_default',
        unlockedAvatars: data.unlockedAvatars ?? ['raccoon_default']
      };
    } else {
      // Primera vez del usuario: crear documento con valores iniciales
      _cache = {
        xp: 0, lvl: 1, vb: 0,
        streak: 0, lastActiveDate: null,
        avatar: 'raccoon_default',
        unlockedAvatars: ['raccoon_default']
      };
      await setDoc(ref, _cache).catch(err => console.warn('Firestore setDoc warning:', err.message));
    }
  } catch (err) {
    console.warn('Firestore progress load warning (usando caché local):', err.message);
  } finally {
    _ready = true;
  }
}

/* ── Verificación de estado ── */
function assertReady() {
  if (!_ready) {
    console.warn('XP system no estaba listo; forzando ready = true');
    _ready = true;
  }
}

/* ── Persistir cambios en Firestore en segundo plano (No Bloqueante) ── */
function persistAsync() {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, 'progress', user.uid);

  // Intentar guardar en Firestore en segundo plano sin demorar la UI
  setDoc(ref, _cache, { merge: true }).catch(() => {});
}

/* ── Getters (lectura desde caché en memoria, sin latencia) ── */
export function getXP()              { assertReady(); return _cache.xp; }
export function getLvl()             { assertReady(); return _cache.lvl; }
export function getVB()              { assertReady(); return _cache.vb; }
export function getStreak()          { assertReady(); return _cache.streak; }
export function getAvatar()          { assertReady(); return _cache.avatar; }
export function getUnlockedAvatars() { assertReady(); return _cache.unlockedAvatars; }

/* ── Sistema de racha diaria ──
   Compara la fecha actual con lastActiveDate para determinar si
   la racha continúa, se reinicia, o ya fue contada hoy.
   Retorna { streak, isNewDay, bonus } */
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

/* ── Bonus XP por racha ──
   3+ días consecutivos: +50 XP extra por mensaje
   7+ días consecutivos: +100 XP extra por mensaje */
export function getStreakBonus() {
  if (_cache.streak >= 7) return 100;
  if (_cache.streak >= 3) return 50;
  return 0;
}

/* ── Añadir XP (Respuesta instantánea 0ms) ── */
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

    // Bonus V-Mapaches al subir de nivel (si hay recompensa de tipo vbucks)
    const reward = REWARDS.find(r => r.lvl === lvl && !r.premium);
    if (reward && reward.type === 'vbucks') {
      _cache.vb += 100;
    }
  }

  _cache.xp  = xp;
  _cache.lvl = lvl;

  // Persistir en segundo plano (asíncrono, no bloqueante)
  persistAsync();

  return { xp: _cache.xp, lvl: _cache.lvl, leveled };
}

/* ── Sistema de avatares ── */

/* ── Comprar un avatar con V-Mapaches ──
   Verifica que el usuario tenga suficientes V-Mapaches y que no lo tenga ya.
   Retorna { success, message } */
export async function buyAvatar(avatarId) {
  assertReady();
  const avatar = AVATARS.find(a => a.id === avatarId);
  if (!avatar) return { success: false, message: 'Avatar no encontrado' };

  if (_cache.unlockedAvatars.includes(avatarId)) {
    return { success: false, message: 'Ya tienes este avatar desbloqueado' };
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

  return { success: true, message: `¡${avatar.name} desbloqueado y equipado! 🎉` };
}

/* Equipar un avatar ya desbloqueado.
   Retorna { success, message } */
export async function setAvatar(avatarId) {
  assertReady();
  const avatar = AVATARS.find(a => a.id === avatarId);
  if (!avatar) return { success: false, message: 'Avatar no encontrado' };

  const isFree = avatar.cost === 0;
  if (!isFree && !_cache.unlockedAvatars.includes(avatarId)) {
    return { success: false, message: 'No tienes este avatar desbloqueado' };
  }

  if (!_cache.unlockedAvatars.includes(avatarId)) {
    _cache.unlockedAvatars.push(avatarId);
  }

  _cache.avatar = avatarId;
  persistAsync();
  return { success: true, message: '¡Avatar equipado! ✨' };
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

/* ── Datos de recompensas del Pase de Batalla ──
   29 recompensas distribuidas entre los 100 niveles.
   Incluye skins, emotes, objetos y V-Mapaches. */
export const REWARDS = [
  { lvl:1,  name:'Mapache Novato',    icon:'🦝', type:'skin',   rarity:'common',    premium:false },
  { lvl:2,  name:'100 V-Mapaches',   icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:5,  name:'Baile Trash',      icon:'🕺', type:'emote',  rarity:'rare',      premium:true  },
  { lvl:8,  name:'Mochila Lata',     icon:'🎒', type:'item',   rarity:'uncommon',  premium:false },
  { lvl:10, name:'Skin Nocturno',    icon:'🌙', type:'skin',   rarity:'epic',      premium:true  },
  { lvl:12, name:'200 V-Mapaches',   icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:15, name:'Spray Mapache',    icon:'🎨', type:'item',   rarity:'common',    premium:false },
  { lvl:18, name:'Baile Basura',     icon:'💃', type:'emote',  rarity:'rare',      premium:true  },
  { lvl:20, name:'Hacha Cubo',       icon:'🪓', type:'item',   rarity:'rare',      premium:true  },
  { lvl:22, name:'300 V-Mapaches',   icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:25, name:'Mapache Dorado',   icon:'✨', type:'skin',   rarity:'legendary', premium:true  },
  { lvl:28, name:'Pantalla Grafiti', icon:'🖼️', type:'item',   rarity:'common',    premium:false },
  { lvl:30, name:'100 V-Mapaches',   icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:33, name:'Baile Nocturno',   icon:'🌟', type:'emote',  rarity:'epic',      premium:true  },
  { lvl:36, name:'Capa Sombra',      icon:'🦸', type:'skin',   rarity:'epic',      premium:true  },
  { lvl:40, name:'500 V-Mapaches',   icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:44, name:'Pico Lunar',       icon:'⛏️', type:'item',   rarity:'legendary', premium:true  },
  { lvl:48, name:'Skin Robot',       icon:'🤖', type:'skin',   rarity:'epic',      premium:true  },
  { lvl:50, name:'200 V-Mapaches',   icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:55, name:'Mapache Legendario',icon:'👑',type:'skin',   rarity:'legendary', premium:true  },
  { lvl:60, name:'Baile Épico',      icon:'🎭', type:'emote',  rarity:'epic',      premium:true  },
  { lvl:65, name:'Escudo Plasma',    icon:'🛡️', type:'item',   rarity:'legendary', premium:true  },
  { lvl:70, name:'500 V-Mapaches',   icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:75, name:'Skin Galaxy',      icon:'🌌', type:'skin',   rarity:'legendary', premium:true  },
  { lvl:80, name:'Baile Galáctico',  icon:'🪐', type:'emote',  rarity:'legendary', premium:true  },
  { lvl:85, name:'1000 V-Mapaches',  icon:'💎', type:'vbucks', rarity:'uncommon',  premium:false },
  { lvl:90, name:'Hacha Estelar',    icon:'⭐', type:'item',   rarity:'legendary', premium:true  },
  { lvl:95, name:'Skin Oscuridad',   icon:'🖤', type:'skin',   rarity:'legendary', premium:true  },
  { lvl:100,name:'Mapache Supremo',  icon:'🏆', type:'skin',   rarity:'legendary', premium:true  },
];
