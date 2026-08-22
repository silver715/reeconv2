/* ==============================================
   CHAT CONTROLLER — js/chat.js (v2.1)
   Lógica completa del aula interactiva con IA y
   motor pedagógico local de respaldo.
   ============================================== */

import { auth } from './firebase-config.js?v=2.1';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initXP, addXP, getStreakBonus, getAvatarEmoji } from './xp.js?v=2.1';
import { askGemini } from './gemini.js?v=2.1';

/* ── Nombres y etiquetas de materias ── */
const modeNames = {
  math:    'Matemáticas',
  spanish: 'Español',
  english: 'Inglés',
  science: 'Ciencias Naturales',
  social:  'Ciencias Sociales',
};

/* ── Sanitización de estado ── */
const validModes = ['math', 'spanish', 'english', 'science', 'social'];
let rawMode = localStorage.getItem('racoon_mode');
let mode = validModes.includes(rawMode) ? rawMode : 'math';

let rawGrade = localStorage.getItem('racoon_grade');
let grade = (rawGrade && rawGrade !== 'null' && rawGrade !== 'undefined') ? rawGrade : 'Primero';

localStorage.setItem('racoon_mode', mode);
localStorage.setItem('racoon_grade', grade);

let messageCount = 0;
let isSending = false;

/* ── Elementos del DOM ── */
const chatBox   = document.getElementById('chat');
const input     = document.getElementById('input');
const typing    = document.getElementById('typing');
const modeLabel = document.getElementById('modeLabel');

/* ── Auth Guard y Saludo Inicial ── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'landing.html';
    return;
  }

  await initXP();

  // Avatar personalizado en el header
  const avatarIconEl = document.getElementById("userAvatarIcon");
  if (avatarIconEl) avatarIconEl.textContent = getAvatarEmoji();

  // Etiqueta de la materia
  if (modeLabel) modeLabel.innerText = modeNames[mode] || 'Matemáticas';

  // Mensaje de bienvenida único
  if (chatBox && chatBox.children.length === 0) {
    let greeting = `🦝 ¡Hola! Soy el Profe Mapache. Estoy listo para ayudarte con **${modeNames[mode]}** en **${grade} grado**. ¿Qué duda o ejercicio tienes hoy?`;
    const bonus = getStreakBonus();
    if (bonus > 0) {
      greeting += `\n\n🔥 ¡Racha activa! Recibes +${bonus} XP extra por mensaje.`;
    }
    addMessage('bot', greeting);
  }
});

/* ── Escuchadores de entrada ── */
if (input) {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}
window.sendMessage = sendMessage;

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

/* ── Sistema de Toast de XP ── */
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
    : `+${amount} XP`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ── Envío de mensaje ── */
async function sendMessage() {
  if (isSending || !input) return;
  const text = input.value.trim();
  if (!text) return;

  isSending = true;
  input.disabled = true;
  addMessage('user', text);
  input.value = '';
  if (typing) typing.style.display = 'flex';
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  try {
    messageCount++;
    const baseXP = messageCount % 3 === 0 ? 150 : 50;
    const streakBonus = getStreakBonus();
    const xpGain = baseXP + streakBonus;

    // 1. Intentar obtener respuesta de Gemini
    let botResponse = await askGemini(text, mode, grade);

    // 2. Si la API de Gemini falla o está offline, usar motor local pedagógico
    if (!botResponse || botResponse.trim().length === 0) {
      botResponse = getLocalResponse(text, mode);
    }

    if (typing) typing.style.display = 'none';
    addMessage('bot', botResponse);

    // 3. Sumar XP y mostrar Toast
    const result = await addXP(xpGain);
    showXPToast(xpGain, result.leveled, result.lvl);

  } catch (err) {
    console.error('[Chat Error]:', err);
    if (typing) typing.style.display = 'none';
    addMessage('bot', '🦝 ¡Excelente pregunta! Cuéntame qué parte del ejercicio te gustaría resolver paso a paso.');
  } finally {
    if (typing) typing.style.display = 'none';
    input.disabled = false;
    input.focus();
    isSending = false;
  }
}

/* ── Motor Local de Respaldo Pedagógico ── */
function getLocalResponse(text, currentMode) {
  const msg = text.toLowerCase();

  if (currentMode === 'math') {
    if (msg.includes('multiplic') || msg.includes('*') || msg.includes('x') || msg.includes('tabla') || msg.includes('veces')) {
      return '🦝 **Multiplicar es sumar grupos iguales** de forma súper rápida.\n\nPor ejemplo: **3 × 4** significa tener **3 grupos de 4 galletas** (4 + 4 + 4 = 12 🍪).\n\n¿Qué números te gustaría multiplicar juntos?';
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
    if (msg.includes('fraccion') || msg.includes('fracción') || msg.includes('mitad') || msg.includes('cuarto')) {
      return '🦝 **Las fracciones son partes de un entero**.\n\nSi cortas una pizza 🍕 en 4 porciones iguales y comes 1, tomaste **1/4** de la pizza.\n\n¿Qué fracción te gustaría entender?';
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
    if (msg.includes('sustantiv')) {
      return '🦝 **Los sustantivos son nombres** de personas (*María*), animales (*mapache*) o cosas (*libro*) 📖.\n\n¿Qué palabras quieres clasificar?';
    }
    return '🦝 El español es un idioma maravilloso ✍️. Cuéntame qué palabra, texto u oración estás estudiando.';
  }

  if (currentMode === 'english') {
    if (msg.includes('color')) return '🦝 Colors in English: 🔴 Red (Rojo), 🔵 Blue (Azul), 🟡 Yellow (Amarillo), 🟢 Green (Verde). What is your favorite color?';
    if (msg.includes('numero') || msg.includes('number')) return '🦝 Numbers in English: 1: One, 2: Two, 3: Three, 4: Four, 5: Five, 10: Ten! Let\'s count together!';
    return '🦝 English is fun! 🌐 Can you tell me which words or sentences you want to practice today?';
  }

  if (currentMode === 'science') {
    return '🦝 En ciencias exploramos el mundo que nos rodea 🌱. Cuéntame: ¿estás estudiando plantas, animales, el cuerpo humano o el universo?';
  }

  if (currentMode === 'social') {
    return '🦝 En sociales aprendemos sobre geografía, historia y culturas 🗺️. ¿Sobre qué país, mapa o época histórica tienes preguntas?';
  }

  return '🦝 ¡Excelente pregunta! Cuéntame los detalles del tema y lo resolvemos juntos paso a paso ⭐';
}
