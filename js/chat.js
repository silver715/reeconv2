/* ==============================
   CHAT — js/chat.js
   ============================== */

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initXP, addXP, getStreakBonus, checkStreak, getAvatarEmoji } from './xp.js';
import { askGemini } from './gemini.js';

/* ─── Nombres de los modos ─── */
const modeNames = {
  math:    'Matemáticas',
  spanish: 'Español',
  english: 'Inglés',
  science: 'Naturales',
  social:  'Sociales',
};

/* ─── Estado ─── */
const validModes = ['math', 'spanish', 'english', 'science', 'social'];
let rawMode = localStorage.getItem('racoon_mode');
let mode = validModes.includes(rawMode) ? rawMode : 'math';

let rawGrade = localStorage.getItem('racoon_grade');
let grade = (rawGrade && rawGrade !== 'null' && rawGrade !== 'undefined') ? rawGrade : 'Primero';

// Persistir valores sanitizados
localStorage.setItem('racoon_mode', mode);
localStorage.setItem('racoon_grade', grade);

let currentProblem = null;
let messageCount = 0;

/* ─── Init ─── */
const chatBox   = document.getElementById('chat');
const input     = document.getElementById('input');
const typing    = document.getElementById('typing');
const modeLabel = document.getElementById('modeLabel');

/* ─── Requiere sesión: verificamos con Firebase antes de dejar usar el chat ─── */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'landing.html';
    return;
  }
  await initXP();
  const avatarIconEl = document.getElementById("userAvatarIcon");
  if (avatarIconEl) avatarIconEl.textContent = getAvatarEmoji();

  modeLabel.innerText = modeNames[mode] || mode;
  
  let greeting = `🦝 ¡Hola! Estoy listo para ayudarte con ${modeNames[mode]}. ¿Qué duda tienes hoy?`;
  
  const streakBonus = getStreakBonus();
  if (streakBonus > 0) {
      greeting += `\n\n¡Tienes una racha activa! Recibirás +${streakBonus} XP extra por mensaje. 🔥`;
  }
  
  addMessage('bot', greeting);
});

input.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

/* El botón "Enviar" en chat.html llama sendMessage() por onclick, así que debe ser global */
window.sendMessage = sendMessage;

/* ─── XP Toast ─── */
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
  setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ─── Formateador de Markdown para la UI ─── */
function formatMarkdown(text) {
  if (!text) return '';
  // 1. Escapar HTML peligroso primero
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Citas (blockquote) -> &gt; texto
  html = html.replace(/^&gt;\s*(.*)$/gmi, '<blockquote class="chat-quote">$1</blockquote>');

  // 3. Negritas -> **texto** o __texto__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 4. Cursivas -> *texto* o _texto_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 5. Viñetas de lista
  html = html.replace(/^[•\-\*]\s+(.*)$/gmi, '• $1');

  // 6. Salto de línea
  html = html.replace(/\n/g, '<br>');

  return html;
}

/* ─── Añadir mensaje al chat ─── */
function addMessage(sender, text) {
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
  }, 30);
}

/* ─── Enviar mensaje ─── */
let isSending = false;

async function sendMessage() {
  if (isSending) return;
  const text = input.value.trim();
  if (!text) return;

  isSending = true;
  input.disabled = true;
  addMessage('user', text);
  input.value = '';
  typing.style.display = 'flex';
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    /* XP Calculation */
    messageCount++;
    const baseXP = messageCount % 3 === 0 ? 150 : 50;
    const streakBonus = getStreakBonus();
    const xpGain = baseXP + streakBonus;

    /* Intentar con la IA de Gemini primero */
    const aiResp = await askGemini(text, mode, grade);
    
    let response;
    if (aiResp !== null && aiResp.trim().length > 0) {
        // Usar respuesta de Gemini
        response = aiResp;
    } else {
        // Fallback a lógica local si la API falla
        const extendedResp = localExtended(text);
        const genericEndings = ['puedes escribirme exactamente', "Can you write me", 'puedes contarme exactamente', 'Cuéntame más'];
        const isGeneric = genericEndings.some(e => extendedResp.includes(e));
        const localResp = smartLocal(text);
        const localIsDefault = localResp === '🦝 Cuéntame qué operación necesitas resolver 😊' || localResp === '🦝 Tú puedes, ¡inténtalo! 💪';

        if (!isGeneric) {
          response = extendedResp;
        } else if (!localIsDefault) {
          response = localResp;
        } else {
          response = extendedResp;
        }
    }

    typing.style.display = 'none';
    addMessage('bot', response);

    /* Añadir XP y mostrar toast */
    const result = await addXP(xpGain);
    showXPToast(xpGain, result.leveled, result.lvl);

  } catch (err) {
    console.error("Error en sendMessage:", err);
  } finally {
    typing.style.display = 'none';
    input.disabled = false;
    input.focus();
    isSending = false;
  }
}

/* ─── Lógica local (respuestas rápidas sin IA) ─── */
function smartLocal(text) {
  const msg = text.toLowerCase();

  if (mode === 'math') {
    if (!currentProblem && (msg.includes('tiene') || msg.includes('+') || msg.includes('-') || /\d/.test(msg))) {
      const nums = msg.match(/\d+/g);
      if (nums && nums.length >= 2) {
        const a = parseInt(nums[0]);
        const b = parseInt(nums[1]);
        const op = (msg.includes('come') || msg.includes('pierde') || msg.includes('quita') || msg.includes('-')) ? 'rest' : 'sum';
        currentProblem = { a, b, op, answer: op === 'sum' ? a + b : a - b };
        return `🦝 Vamos paso a paso...\n\n¿Qué operación crees que hay que hacer aquí: sumar o restar? 🤔`;
      }
    }
    if (currentProblem) {
      if (/^\d+$/.test(msg)) {
        const ans = parseInt(msg);
        if (ans === currentProblem.answer) {
          currentProblem = null;
          return `🦝 ¡Exacto! ¡Muy bien! 🎉\n\nSe nota que lo entendiste 💪`;
        }
        return `🦝 Casi, pero revisa 👀\n\n¿Estás usando la operación correcta? Inténtalo de nuevo.`;
      }
      if (msg.includes('sum') || msg.includes('más') || msg.includes('mas')) {
        if (currentProblem.op === 'sum') return `🦝 ¡Correcto, es suma! Ahora calcula ${currentProblem.a} + ${currentProblem.b} = ?`;
        return `🦝 Hmm, fíjate bien en el problema... ¿seguro que hay que sumar?`;
      }
      if (msg.includes('rest') || msg.includes('menos')) {
        if (currentProblem.op === 'rest') return `🦝 ¡Correcto, es resta! Ahora calcula ${currentProblem.a} - ${currentProblem.b} = ?`;
        return `🦝 Hmm, fíjate bien en el problema... ¿seguro que hay que restar?`;
      }
      return `🦝 Intenta resolverlo y dime el resultado 😉`;
    }
    if (msg.includes('+')) return `🦝 Para sumar, empieza por las unidades 👀`;
    if (msg.includes('-')) return `🦝 En la resta, si no alcanza el número de arriba, pedimos prestado 😎`;
    if (msg.includes('x') || msg.includes('*')) return `🦝 En la multiplicación, podemos pensar en grupos iguales 🎯`;
    return `🦝 Cuéntame qué operación necesitas resolver 😊`;
  }

  if (mode === 'spanish') return `🦝 Lee la oración despacio y busca: ¿quién hace la acción? (sujeto) y ¿qué hace? (verbo) ✍️`;
  if (mode === 'english') return `🦝 Find who does the action (subject) and what they do (verb) 👀`;
  if (mode === 'science')  return `🦝 Piensa en cómo eso ocurre en la naturaleza que ves todos los días 🌱`;
  if (mode === 'social')   return `🦝 Piensa: ¿en qué tiempo ocurrió? ¿en qué lugar? Eso te ayudará 🗺️`;

  return `🦝 Tú puedes, ¡inténtalo! 💪`;
}

/* ─── Respuestas locales extendidas (sin IA) ─── */
function localExtended(text) {
  const msg = text.toLowerCase();

  /* ── MATEMÁTICAS ── */
  if (mode === 'math') {
   if (msg.includes('suma') || msg.includes('+') || msg.includes('adicion') || msg.includes('mas'))
      return '🦝 La suma es juntar cosas, como si tuvieras 1 dulce 🍬 y te dan otro, ahora tienes más. Ejemplo: 2+2=4';
    if (msg.includes('fraccion') || msg.includes('fracción') || msg.includes('numerador') || msg.includes('denominador'))
      return '🦝 Las fracciones son partes de un entero. Si partes una pizza en 4 pedazos y comes 1, tienes 1/4. ¿Qué fracción necesitas entender?';
    if (msg.includes('*') || msg.includes('tabla'))
      return '🦝 Multiplicar es sumar varias veces el mismo número. Por ejemplo: 3×4 = 3+3+3+3 = 12. ¿Qué tabla te está costando?';
    if (msg.includes('/') || msg.includes('divid'))
      return '🦝 Dividir es repartir en partes iguales. Si tienes 12 dulces y 3 amigos, ¿cuántos le tocan a cada uno? Prueba: 12 ÷ 3 = ?';
    if (msg.includes('mayor') || msg.includes('menor') || msg.includes('>') || msg.includes('<'))
      return '🦝 Para comparar números, fíjate primero en cuántos dígitos tienen. Más dígitos = más grande. ¿Cuáles dos números comparas?';
    if (msg.includes('decim') || msg.includes('punto') || msg.includes('coma'))
      return '🦝 Los decimales son partes de 1. El punto separa los enteros de las partes. 0.5 = la mitad. ¿Qué operación tienes?';
    if (msg.includes('geometr') || msg.includes('triángulo') || msg.includes('cuadrado') || msg.includes('círculo'))
      return '🦝 Las figuras geométricas tienen lados y ángulos. Un triángulo tiene 3 lados, un cuadrado tiene 4 lados iguales. ¿Cuál figura estudias?';
    if (msg.includes('problem') || msg.includes('palabra'))
      return '🦝 Para resolver problemas de palabras:\n1. Lee despacio 👀\n2. ¿Qué datos tienes?\n3. ¿Qué te piden?\n4. ¿Sumar, restar, multiplicar o dividir?\nCuéntame el problema 😊';
    return '🦝 En matemáticas, lo más importante es ir paso a paso. ¿Puedes escribirme exactamente qué dice el ejercicio?';
  }

  /* ── ESPAÑOL ── */
  if (mode === 'spanish') {
    if (msg.includes('sujeto') || msg.includes('predicado'))
      return '🦝 El sujeto es quien hace la acción ("El niño corre"). El predicado es lo que hace ("corre rápido"). ¿Cuál oración tienes?';
    if (msg.includes('sustantiv'))
      return '🦝 Los sustantivos son nombres de personas, animales o cosas: casa, perro, María. ¿Cuáles necesitas identificar?';
    if (msg.includes('verbo'))
      return '🦝 Los verbos son acciones o estados: correr, comer, ser, estar. En la oración, el verbo te dice QUÉ PASA. ¿Cuál buscas?';
    if (msg.includes('adjetiv'))
      return '🦝 Los adjetivos describen al sustantivo: "la casa GRANDE", "el perro CAFÉ". ¿Puedes decirme la oración completa?';
    if (msg.includes('acento') || msg.includes('tilde') || msg.includes('ortograf'))
      return '🦝 Las palabras agudas llevan tilde cuando terminan en N, S o vocal. Ejemplo: café, camión. ¿Qué palabra tienes?';
    if (msg.includes('texto') || msg.includes('lectura') || msg.includes('párrafo'))
      return '🦝 Para entender un texto:\n1. Lee todo una vez 📖\n2. Subraya las ideas principales\n3. ¿De qué trata el texto?\nCuéntame qué leíste 😊';
    if (msg.includes('sinonim'))
      return '🦝 Los sinónimos son palabras con significado parecido: feliz = contento = alegre. ¿Qué palabra buscas?';
    if (msg.includes('antonim'))
      return '🦝 Los antónimos son palabras con significado opuesto: frío ↔ caliente, grande ↔ pequeño. ¿Cuál necesitas?';
    return '🦝 El español tiene muchas reglas. ¿Puedes copiarme exactamente el ejercicio o la oración para ayudarte mejor? ✍️';
  }

  /* ── INGLÉS ── */
  if (mode === 'english') {
    if (msg.includes('verb') || msg.includes('tense') || msg.includes('tiempo'))
      return '🦝 In English, verbs change with time:\n• Present: I eat 🍎\n• Past: I ate 🍎\n• Future: I will eat 🍎\nWhich tense do you need?';
    if (msg.includes('pronoun') || msg.includes('pronombre') || msg.includes('he') || msg.includes('she') || msg.includes('they'))
      return '🦝 Pronouns replace names:\nI / You / He / She / It / We / They\nExample: "María runs" → "She runs" 🏃\nWhat sentence do you have?';
    if (msg.includes('vocabular') || msg.includes('word') || msg.includes('palabra') || msg.includes('significa'))
      return '🦝 When you find a new word, think:\n1. Does it look like a Spanish word? 🤔\n2. What\'s happening in the sentence?\nWhat word do you need?';
    if (msg.includes('color') || msg.includes('colour'))
      return '🦝 Colors in English:\nred 🔴 blue 🔵 green 🟢 yellow 🟡 orange 🟠 purple 🟣 black ⚫ white ⚪\nWhich do you need to practice?';
    if (msg.includes('number') || msg.includes('número') || msg.includes('count'))
      return '🦝 Numbers: one, two, three, four, five, six, seven, eight, nine, ten ✋\nPractice: how do you say 7 in English?';
    if (msg.includes('greet') || msg.includes('hello') || msg.includes('hola'))
      return '🦝 Greetings in English:\n• Hello / Hi 👋\n• Good morning ☀️\n• Good afternoon 🌤️\n• Good night 🌙\nPractice one with me!';
    return '🦝 Let\'s practice English! Can you write me the exact exercise or sentence? I\'ll guide you step by step 🌐';
  }

  /* ── CIENCIAS NATURALES ── */
  if (mode === 'science') {
    if (msg.includes('fotosíntesis') || msg.includes('fotosintesis') || msg.includes('planta'))
      return '🦝 Las plantas hacen su propio alimento con luz solar, agua y CO₂. Es como cocinar usando el sol 🌞 ¿Qué parte de la fotosíntesis no entiendes?';
    if (msg.includes('animal') || msg.includes('mamífero') || msg.includes('reptil') || msg.includes('ave'))
      return '🦝 Los animales se clasifican por cómo nacen y se alimentan:\n• Mamíferos: tienen pelo, dan leche 🐄\n• Aves: tienen plumas, ponen huevos 🐦\n• Reptiles: tienen escamas 🐊\n¿Cuál grupo estudias?';
    if (msg.includes('celula'))
      return '🦝 La célula es la unidad más pequeña de los seres vivos. Tiene:\n• Membrana: envoltura protectora\n• Núcleo: el "cerebro"\n• Citoplasma: el "relleno"\n¿Qué necesitas recordar?';
    if (msg.includes('agua') || msg.includes('ciclo') || msg.includes('lluvia') || msg.includes('evaporac'))
      return '🦝 El ciclo del agua:\n1. El sol calienta el agua → se evapora ☀️\n2. Sube y forma nubes ☁️\n3. Se enfría → lluvia 🌧️\n4. Vuelve a ríos y mares 💧\n¿Qué parte estudias?';
    if (msg.includes('sistema solar') || msg.includes('planeta') || msg.includes('sol') || msg.includes('luna'))
      return '🦝 El sistema solar tiene 8 planetas. El más cercano al sol es Mercurio, el más lejano Neptuno. La Tierra es el tercero 🌍. ¿Qué planeta estudias?';
    if (msg.includes('cuerpo') || msg.includes('órgano') || msg.includes('hueso') || msg.includes('corazón'))
      return '🦝 El cuerpo humano tiene sistemas que trabajan juntos:\n• Digestivo: procesa alimentos 🍎\n• Circulatorio: mueve la sangre ❤️\n• Respiratorio: toma oxígeno 💨\n¿Cuál sistema estudias?';
    return '🦝 Las ciencias explican el mundo que nos rodea 🌿. ¿Puedes contarme exactamente qué dice tu libro o tarea? Así te guío mejor.';
  }

  /* ── SOCIALES ── */
  if (mode === 'social') {
    if (msg.includes('coloni') || msg.includes('conquist') || msg.includes('español'))
      return '🦝 La conquista de América fue cuando los españoles llegaron en 1492 con Cristóbal Colón. Cambió todo para los pueblos indígenas. ¿Qué período exacto estudias?';
    if (msg.includes('independencia') || msg.includes('libertad') || msg.includes('bolivar') || msg.includes('bolívar'))
      return '🦝 La independencia fue cuando América se liberó de España (1810-1830 aprox). Simón Bolívar lideró la liberación de varios países. ¿De qué país estudias la independencia?';
    if (msg.includes('mapa') || msg.includes('continente') || msg.includes('país') || msg.includes('capital'))
      return '🦝 Para aprender geografía, ubica primero el continente, luego el país, luego la ciudad. ¿Qué lugar necesitas localizar? 🗺️';
    if (msg.includes('cultura') || msg.includes('indigena') || msg.includes('indígena') || msg.includes('maya') || msg.includes('inca') || msg.includes('azteca'))
      return '🦝 Las culturas indígenas tenían:\n• Mayas: matemáticas y calendarios avanzados 📅\n• Incas: gran imperio en los Andes 🏔️\n• Aztecas: poderosa ciudad en México\n¿Cuál estudias?';
    if (msg.includes('gobierno') || msg.includes('democracia') || msg.includes('presidente'))
      return '🦝 En una democracia, los ciudadanos eligen a sus líderes mediante votos 🗳️. El presidente dirige el país por un tiempo definido. ¿Qué aspecto del gobierno estudias?';
    if (msg.includes('guerra') || msg.includes('conflicto') || msg.includes('batalla'))
      return '🦝 Los conflictos históricos tienen causas y consecuencias. Para estudiarlos pregúntate:\n1. ¿Por qué ocurrió?\n2. ¿Quiénes participaron?\n3. ¿Qué cambió después?\n¿Qué conflicto estudias?';
    return '🦝 Las ciencias sociales conectan personas, lugares y tiempo 🌍. ¿Puedes escribirme el tema exacto de tu tarea? Así te ayudo mejor.';
  }

  return '🦝 Cuéntame más sobre tu duda y te ayudo paso a paso 💪';
}
