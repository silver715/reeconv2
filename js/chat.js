/* ==============================================
   CHAT CONTROLLER — js/chat.js (v2.4)
   Aula interactiva con memoria de sesión, renderizado
   Markdown enriquecido y respaldo pedagógico local.
   ============================================== */

import { auth } from './firebase-config.js?v=2.4';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initXP, addXP, getStreakBonus, getAvatarEmoji, getAvatarImg } from './xp.js?v=2.4';
import { askGemini } from './gemini.js?v=2.4';

/* ── Nombres y etiquetas de materias ── */
const modeNames = {
  math:    'Matemáticas',
  spanish: 'Español',
  english: 'Inglés',
  science: 'Ciencias Naturales',
  social:  'Ciencias Sociales',
};

const placeholders = {
  math:    'Escribe un ejercicio o duda de matemáticas...',
  spanish: 'Pregunta sobre ortografía, oraciones o lectura...',
  english: 'Type a word, phrase or question in English...',
  science: 'Pregunta sobre animales, plantas, el cuerpo...',
  social:  'Pregunta sobre historia, mapas o culturas...',
};

/* ── Estado de Sesión ── */
const validModes = ['math', 'spanish', 'english', 'science', 'social'];
let rawMode = localStorage.getItem('racoon_mode');
let mode = validModes.includes(rawMode) ? rawMode : 'math';

let rawGrade = localStorage.getItem('racoon_grade');
let grade = (rawGrade && rawGrade !== 'null' && rawGrade !== 'undefined') ? rawGrade : 'Primero';

localStorage.setItem('racoon_mode', mode);
localStorage.setItem('racoon_grade', grade);

let messageCount = 0;
let isSending = false;
const conversationHistory = []; // Memoria de mensajes para la IA

/* ── Elementos del DOM ── */
const chatBox   = document.getElementById('chat');
const input     = document.getElementById('input');
const sendBtn   = document.getElementById('sendBtn');
const typing    = document.getElementById('typing');
const modeLabel = document.getElementById('modeLabel');

/* ── Registrar función global y escuchadores de eventos ── */
window.sendMessage = sendMessage;

if (input) {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

if (sendBtn) {
  sendBtn.addEventListener('click', sendMessage);
}

/* ── Auth Guard y Bienvenida ── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'landing.html';
    return;
  }

  await initXP();

  // Avatar personalizado en el header
  const avatarIconEl = document.getElementById("userAvatarIcon");
  if (avatarIconEl) {
    try {
      const imgSrc = (typeof getAvatarImg === 'function') ? getAvatarImg() : 'img/avatars/raccoon_happy.png';
      avatarIconEl.innerHTML = `<img src="${imgSrc}" alt="Avatar" style="width:30px; height:30px; object-fit:contain; vertical-align:middle;" />`;
    } catch {
      avatarIconEl.textContent = getAvatarEmoji();
    }
  }

  // Etiqueta de materia y placeholder
  if (modeLabel) modeLabel.innerText = modeNames[mode] || 'Matemáticas';
  if (input) input.placeholder = placeholders[mode] || 'Escribe tu duda...';

  // Mensaje de bienvenida inicial
  if (chatBox && chatBox.children.length === 0) {
    const greeting = `🦝 ¡Hola! Soy el **Profe Mapache**. Estoy listo para ayudarte con **${modeNames[mode]}** en **${grade} grado**.\n\n¿Qué ejercicio o pregunta tienes hoy?`;
    addMessage('bot', greeting);
  }
});

/* ── Formateador de Markdown para la UI ── */
function formatMarkdown(text) {
  if (!text) return '';
  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  safe = safe.replace(/^&gt;\s*(.*)$/gmi, '<blockquote class="chat-quote">$1</blockquote>');
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/__(.*?)__/g, '<strong>$1</strong>');
  safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
  safe = safe.replace(/_(.*?)_/g, '<em>$1</em>');
  safe = safe.replace(/^[•\-\*]\s+(.*)$/gmi, '• $1');
  safe = safe.replace(/\n/g, '<br>');

  return safe;
}

/* ── Añadir burbuja de mensaje ── */
function addMessage(sender, text) {
  if (!chatBox) return;
  const div = document.createElement('div');
  div.classList.add('message', sender);
  if (sender === 'bot') {
    div.innerHTML = formatMarkdown(text);
  } else {
    div.innerText = text;
  }
  chatBox.appendChild(div);
  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 40);
}

/* ── Toast de Recompensa de XP ── */
function showXPToast(amount, leveledUp, newLvl) {
  let toast = document.getElementById('xp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'xp-toast';
    toast.className = 'xp-toast';
    document.body.appendChild(toast);
  }
  toast.innerText = leveledUp
    ? `🎉 ¡Nivel ${newLvl}! +${amount} XP`
    : `+${amount} XP ⭐`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ── Envío de mensaje interactivo ── */
async function sendMessage() {
  if (isSending || !input) return;
  const text = input.value.trim();
  if (!text) return;

  isSending = true;
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;
  addMessage('user', text);
  input.value = '';
  if (typing) typing.style.display = 'flex';
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  try {
    messageCount++;
    const baseXP = messageCount % 3 === 0 ? 150 : 50;
    const streakBonus = getStreakBonus();
    const xpGain = baseXP + streakBonus;

    // 1. Consultar a Gemini con la memoria previa
    let botResponse = await askGemini(text, mode, grade, conversationHistory);

    // 2. Si la API falla, recurrir al motor pedagógico local
    if (!botResponse || botResponse.trim().length === 0) {
      botResponse = getLocalResponse(text, mode);
    }

    // 3. Guardar en memoria de conversación
    conversationHistory.push({ role: 'user', text: text });
    conversationHistory.push({ role: 'model', text: botResponse });

    if (typing) typing.style.display = 'none';
    addMessage('bot', botResponse);

    // 4. Conceder XP al estudiante
    const result = await addXP(xpGain);
    showXPToast(xpGain, result.leveled, result.lvl);

  } catch (err) {
    console.error('[Chat Execution Error]:', err);
    if (typing) typing.style.display = 'none';
    addMessage('bot', '🦝 ¡Excelente! Vamos a resolverlo paso a paso. ¿Qué parte del ejercicio te gustaría calcular primero?');
  } finally {
    if (typing) typing.style.display = 'none';
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
    isSending = false;
  }
}

/* ── Motor Local de Respaldo Pedagógico ── */
function getLocalResponse(text, currentMode) {
  const msg = text.toLowerCase();

  if (currentMode === 'math') {
    if (msg.includes('multiplic') || msg.includes('*') || msg.includes('x') || msg.includes('tabla') || msg.includes('veces')) {
      return '🦝 **Multiplicar es sumar grupos iguales**.\n\nPor ejemplo: **3 × 4** significa tener **3 grupos de 4 galletas** (4 + 4 + 4 = 12 🍪).\n\n¿Qué números te gustaría multiplicar juntos?';
    }
    if (msg.includes('sum') || msg.includes('+') || msg.includes('mas') || msg.includes('juntar') || msg.includes('total')) {
      return '🦝 **Sumar es juntar o añadir cantidades**.\n\nSi tienes **15 lápices** y te regalan **10 más**, los unes todos: 15 + 10 = 25 ✏️.\n\n¿Qué cantidades necesitas sumar?';
    }
    if (msg.includes('rest') || msg.includes('-') || msg.includes('menos') || msg.includes('quitar') || msg.includes('diferencia')) {
      return '🦝 **Restar es quitar o encontrar la diferencia**.\n\nSi tienes 10 manzanas 🍎 y te comes 3, te quedan: 10 - 3 = 7.\n\n¿Qué resta estás resolviendo?';
    }
    if (msg.includes('divid') || msg.includes('/') || msg.includes('repartir')) {
      return '🦝 **Dividir es repartir en partes iguales**.\n\nSi tienes 12 dulces 🍬 y 3 amigos, a cada uno le tocan: 12 ÷ 3 = 4.\n\n¿Entre cuántos quieres repartir?';
    }
    return '🦝 En matemáticas vamos paso a paso. ¿Puedes escribir los números del ejercicio que estás resolviendo? 📐';
  }

  if (currentMode === 'spanish') {
    if (msg.includes('sujeto') || msg.includes('predicado')) {
      return '🦝 **El Sujeto** es quién hace la acción (*"El perro"*), y el **Predicado** es qué hace (*"corre en el parque"*).\n\n¿Cuál es tu oración?';
    }
    if (msg.includes('verbo') || msg.includes('accion')) {
      return '🦝 **Los verbos son palabras de acción** como *correr, saltar, estudiar y reír* 🏃‍♂️.\n\n¿Qué verbo buscas identificar?';
    }
    return '🦝 El español es un idioma maravilloso ✍️. Cuéntame qué palabra, texto u oración estás estudiando.';
  }

  if (currentMode === 'english') {
    if (msg.includes('color')) return '🦝 Colors in English: 🔴 Red (Rojo), 🔵 Blue (Azul), 🟡 Yellow (Amarillo), 🟢 Green (Verde). What is your favorite color?';
    if (msg.includes('numero') || msg.includes('number')) return '🦝 Numbers in English: 1: One, 2: Two, 3: Three, 4: Four, 5: Five, 10: Ten! Let\'s count together!';
    return '🦝 English is fun! 🌐 What words or sentences do you want to practice today?';
  }

  if (currentMode === 'science') {
    return '🦝 En ciencias exploramos el mundo que nos rodea 🌱. ¿Quieres estudiar plantas, animales, el cuerpo humano o el universo?';
  }

  if (currentMode === 'social') {
    return '🦝 En sociales aprendemos sobre geografía, historia y culturas 🗺️. ¿Sobre qué país o mapa tienes dudas?';
  }

  return '🦝 ¡Excelente pregunta! Cuéntame los detalles del tema y lo resolvemos juntos paso a paso ⭐';
}
