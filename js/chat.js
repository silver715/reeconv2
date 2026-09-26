// Aula virtual de chat: tutor interactivo con Profe Mapache

import { auth } from './firebase-config.js?v=3.9';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initXP, addXP, getStreakBonus, getAvatarEmoji, getAvatarImg, getAvatarData } from './xp.js?v=3.9';
import { askGemini } from './gemini.js?v=3.9';

// Nombres y etiquetas de materias
const modeNames = {
  math:    'Matemáticas',
  spanish: 'Español',
  english: 'Inglés',
  science: 'Ciencias Naturales',
  social:  'Ciencias Sociales',
};

const placeholders = {
  math:    'Pregúntale al Profe un ejercicio de matemáticas...',
  spanish: 'Escribe una duda de palabras, cuentos o letras...',
  english: 'Type a word or sentence in English...',
  science: 'Pregunta sobre animales, plantas o la naturaleza...',
  social:  'Pregunta sobre mapas, ciudades o culturas...',
};

// Estado de Sesión
const validModes = ['math', 'spanish', 'english', 'science', 'social'];
let rawMode = localStorage.getItem('racoon_mode');
let mode = validModes.includes(rawMode) ? rawMode : 'math';

let rawGrade = localStorage.getItem('racoon_grade');
let grade = (rawGrade && rawGrade !== 'null' && rawGrade !== 'undefined') ? rawGrade : 'Primero';

localStorage.setItem('racoon_mode', mode);
localStorage.setItem('racoon_grade', grade);

let messageCount = 0;
let isSending = false;
const conversationHistory = [];

// Elementos del DOM
const chatBox           = document.getElementById('chat');
const input             = document.getElementById('input');
const sendBtn           = document.getElementById('sendBtn');
const typing            = document.getElementById('typing');
const modeLabel         = document.getElementById('modeLabel');
const gradeBadge        = document.getElementById('gradeBadge');
const quickChipsBar     = document.getElementById('quickChipsBar');
const toggleStickerBtn  = document.getElementById('toggleStickerBtn');
const stickerDrawer     = document.getElementById('stickerDrawer');
const closeStickerBtn   = document.getElementById('closeStickerDrawerBtn');
const stickerGrid       = document.getElementById('stickerGrid');
const chatHeroBanner    = document.getElementById('chatHeroBanner');
const closeHeroBtn      = document.getElementById('closeHeroBtn');

// Modal de ajustes
const openSettingsBtn   = document.getElementById('openSettingsBtn');
const closeSettingsBtn  = document.getElementById('closeSettingsBtn');
const settingsModal     = document.getElementById('settingsModal');
const geminiKeyInput    = document.getElementById('geminiKeyInput');
const saveKeyBtn        = document.getElementById('saveKeyBtn');
const keyFeedback       = document.getElementById('keyStatusFeedback');

// Lista de Stickers Adorables Disponibles (Sin Emojis)
const mascotStickers = [
  { id: 'raccoon_celebrate',     title: '¡Celebrar!',  phrase: '¡Estoy celebrando contigo! ¡Gran trabajo, eres un campeón!' },
  { id: 'raccoon_sunglasses',    title: 'Genial',      phrase: '¡Esa actitud me gusta! Modo pro y con toda la energía.' },
  { id: 'raccoon_flower_crown',  title: 'Flores',      phrase: '¡Qué lindo sticker! La amabilidad y el estudio van de la mano.' },
  { id: 'raccoon_sunflower',     title: 'Girasol',     phrase: '¡Sonrisa brillante como un girasol! Vamos con entusiasmo.' },
  { id: 'raccoon_eating_cookie', title: 'Galletita',   phrase: '¡Qué rica galleta! Comer bien y estudiar nos hace fuertes.' },
  { id: 'raccoon_candy_jar',     title: 'Dulces',      phrase: '¡Un frasquito de conocimiento dulce! ¿Seguimos practicando?' },
  { id: 'raccoon_candy_plate',   title: 'Caramelos',   phrase: '¡Lluvia de caramelos por tu gran esfuerzo en clase!' },
  { id: 'raccoon_pumpkin',       title: 'Calabaza',    phrase: '¡Qué divertida calabaza! Me encantan tus ocurrencias.' },
  { id: 'raccoon_icepack',       title: 'Duda',        phrase: '¿Se te cansó la cabecita? ¡No te preocupes, lo explicamos con calma!' },
  { id: 'raccoon_blushing',      title: 'Tierno',      phrase: '¡Gracias! Yo también estoy muy feliz de ser tu Profe Mapache.' },
  { id: 'raccoon_heart_nose',    title: 'Corazón',     phrase: '¡Puro amor por el aprendizaje! ¡Vamos con toda!' },
  { id: 'raccoon_gamer_toilet',  title: 'Gamer',       phrase: '¡Hasta en el descanso no paramos de aprender y jugar!' }
];

// Elementos de Llamada y Voz
const callBtn           = document.getElementById('callBtn');
const voiceMicBtn       = document.getElementById('voiceMicBtn');
const voiceCallBanner   = document.getElementById('voiceCallBanner');
const bannerHangupBtn   = document.getElementById('bannerHangupBtn');
const callTimerEl       = document.getElementById('callTimer');
const callWaveBars      = document.getElementById('callWaveBars');
const callBannerStatus  = document.getElementById('callBannerStatus');

let isCallActive = false;
let callDurationSec = 0;
let callTimerInterval = null;
let currentUtterance = null;
let audioCtx = null;
let recognition = null;
let isRecording = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playCallSound(type = 'connect') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (type === 'connect') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (_) {}
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  } catch (_) {}

  if (callWaveBars) callWaveBars.classList.add('speaking');
  if (callBannerStatus) callBannerStatus.textContent = 'Profe Mapache hablando...';

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  window._raccoonActiveUtterance = utterance;
  utterance.lang = 'es-ES';
  utterance.rate = 1.0;
  utterance.pitch = 1.1;

  const onDone = () => {
    if (callWaveBars) callWaveBars.classList.remove('speaking');
    if (callBannerStatus) callBannerStatus.textContent = 'En vivo • Puedes hablar o escribir';
  };

  utterance.onend = onDone;
  utterance.onerror = onDone;

  const maxTime = Math.max(3000, Math.min(22000, (text.length / 9) * 1000 + 3000));
  setTimeout(() => {
    if (callWaveBars && callWaveBars.classList.contains('speaking')) onDone();
  }, maxTime);

  const voices = window.speechSynthesis.getVoices() || [];
  const spanishVoice = voices.find(v => v.lang && v.lang.startsWith('es') && (
    v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Sabina') ||
    v.name.includes('Helena') || v.name.includes('Castilian') || v.name.includes('Mexico') ||
    v.name.includes('Spain') || v.name.includes('Laura') || v.name.includes('Jorge')
  )) || voices.find(v => v.lang && v.lang.startsWith('es'));

  if (spanishVoice) utterance.voice = spanishVoice;
  window.speechSynthesis.speak(utterance);
}

function startVoiceCall() {
  if (isCallActive) return;
  isCallActive = true;
  playCallSound('connect');

  if (voiceCallBanner) voiceCallBanner.style.display = 'flex';
  if (callBtn) {
    callBtn.classList.add('in-call');
    callBtn.innerHTML = `
      <svg class="call-btn-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.053 15.053 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z"/>
      </svg>
      <span class="call-btn-label">En Llamada</span>
    `;
  }

  callDurationSec = 0;
  if (callTimerEl) callTimerEl.textContent = '00:00';
  clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    callDurationSec++;
    const mins = String(Math.floor(callDurationSec / 60)).padStart(2, '0');
    const secs = String(callDurationSec % 60).padStart(2, '0');
    if (callTimerEl) callTimerEl.textContent = `${mins}:${secs}`;
  }, 1000);

  try { addXP(75); } catch (_) {}

  const callGreeting = `¡Llamada conectada! Hola, soy el **Profe Mapache** en vivo. Estoy listo para ayudarte con tus dudas de **${modeNames[mode] || 'Matemáticas'}**. Cuéntame tu duda hablando por micrófono o escribiendo.`;
  addMessage('bot', callGreeting);
}

function endVoiceCall() {
  if (!isCallActive) return;
  isCallActive = false;
  playCallSound('hangup');

  clearInterval(callTimerInterval);
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (_) {}
  }

  if (voiceCallBanner) voiceCallBanner.style.display = 'none';
  if (callBtn) {
    callBtn.classList.remove('in-call');
    callBtn.innerHTML = `
      <svg class="call-btn-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.053 15.053 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z"/>
      </svg>
      <span class="call-btn-label">Llamar</span>
      <span class="call-btn-badge">+75 XP</span>
    `;
  }

  addMessage('bot', '¡Llamada finalizada! Gran esfuerzo aprendiendo hoy. Puedes seguir escribiéndome cuando quieras.');
}

// Reconocimiento de Voz para Micrófono
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  try {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    
    recognition.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript && transcript.trim()) {
        if (input) input.value = transcript.trim();
        sendMessage();
      }
    };
    
    recognition.onend = () => {
      isRecording = false;
      if (voiceMicBtn) voiceMicBtn.classList.remove('recording');
    };
    
    recognition.onerror = (err) => {
      console.warn('[Speech Recognition error]', err);
      isRecording = false;
      if (voiceMicBtn) voiceMicBtn.classList.remove('recording');
      if (input) {
        input.placeholder = 'Escribe tu duda y el Profe te responderá...';
        input.focus();
      }
    };
  } catch (_) {}
}

if (callBtn) {
  callBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isCallActive) {
      startVoiceCall();
    } else {
      endVoiceCall();
    }
  });
}

if (bannerHangupBtn) {
  bannerHangupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    endVoiceCall();
  });
}

if (voiceMicBtn) {
  voiceMicBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!recognition) {
      if (input) {
        input.focus();
        input.placeholder = 'Escribe tu duda y el Profe te responderá con voz...';
      }
      return;
    }
    
    if (isRecording) {
      try { recognition.stop(); } catch (_) {}
      isRecording = false;
      voiceMicBtn.classList.remove('recording');
    } else {
      try {
        recognition.start();
        isRecording = true;
        voiceMicBtn.classList.add('recording');
      } catch (err) {
        console.warn('Recognition start notice:', err);
      }
    }
  });
}

// Configurar Funciones Globales
window.sendMessage = sendMessage;

if (input) {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

if (sendBtn) {
  sendBtn.addEventListener('click', sendMessage);
}

// Auth Guard y Bienvenida
onAuthStateChanged(auth, async (user) => {
  const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';
  if (!user && !isDemo) {
    window.location.href = 'landing.html';
    return;
  }

  try {
    await initXP();
  } catch (_) {}

  // Actualizar skin activa del estudiante en el Header y Barra de Input
  const userAvatarData = (typeof getAvatarData === 'function') ? getAvatarData() : { name: 'Mapache Feliz', img: 'img/avatars/raccoon_happy.png' };
  const headerSkinImg  = document.getElementById("headerStudentSkinImg");
  const headerSkinName = document.getElementById("headerStudentSkinName");
  const inputSkinImg   = document.getElementById("inputUserSkinImg");
  if (headerSkinImg)  headerSkinImg.src = userAvatarData.img;
  if (headerSkinName) headerSkinName.textContent = userAvatarData.name;
  if (inputSkinImg)   inputSkinImg.src = userAvatarData.img;

  // Etiquetas de materia y grado
  if (modeLabel) modeLabel.innerText = modeNames[mode] || 'Matemáticas';
  if (gradeBadge) gradeBadge.innerText = `${grade} Grado`;
  if (input) input.placeholder = placeholders[mode] || 'Escribe tu duda aquí...';

  // Mensaje de bienvenida inicial (sin emojis)
  if (chatBox && chatBox.children.length === 0) {
    const greeting = `¡Hola, amiguito! Soy el **Profe Mapache**.\n\nEstoy listo para ayudarte con tus dudas de **${modeNames[mode]}** en **${grade} grado**.\n\nPuedes escribirme tu duda o tocar las **ayudas rápidas**. ¿Qué reto resolvemos hoy?`;
    addMessage('bot', greeting);
  }
});

// Formateador de Markdown para la UI
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

// Añadir burbuja de mensaje con gran protagonismo para la skin del estudiante
function addMessage(sender, text, isSticker = false, stickerSrc = '') {
  if (!chatBox) return;

  const row = document.createElement('div');
  row.classList.add('message-row', sender);

  // Avatar al costado de la burbuja
  const avatarDiv = document.createElement('div');
  avatarDiv.classList.add('msg-avatar');

  const contentCol = document.createElement('div');
  contentCol.classList.add('msg-content-col');

  if (sender === 'bot') {
    avatarDiv.classList.add('bot-avatar');
    avatarDiv.innerHTML = `<img src="img/raccoon_sitting_cute.png" alt="Profe Mapache" />`;

    const authorTag = document.createElement('div');
    authorTag.className = 'msg-author-tag bot-tag';
    authorTag.textContent = 'Profe Mapache';
    contentCol.appendChild(authorTag);
  } else {
    avatarDiv.classList.add('user-avatar');
    const uData = (typeof getAvatarData === 'function') ? getAvatarData() : { img: 'img/avatars/raccoon_happy.png', name: 'Mapache' };
    avatarDiv.innerHTML = `<img src="${uData.img}" alt="${uData.name}" />`;
    avatarDiv.title = `Tu Skin: ${uData.name}`;

    const authorTag = document.createElement('div');
    authorTag.className = 'msg-author-tag user-tag';
    authorTag.innerHTML = `Tú <span class="skin-pill">${uData.name}</span>`;
    contentCol.appendChild(authorTag);
  }

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');

  if (isSticker) {
    msgDiv.innerHTML = `<img src="${stickerSrc}" alt="Sticker" class="chat-sticker-img" />`;
  } else if (sender === 'bot') {
    msgDiv.innerHTML = formatMarkdown(text);

    // Botón para escuchar la respuesta hablada por el Profe
    const cleanSpeech = text.replace(/[*#_`~>]/g, '').replace(/<[^>]*>/g, '').trim();
    if (cleanSpeech.length > 0) {
      const speakBtn = document.createElement('button');
      speakBtn.className = 'msg-speak-btn';
      speakBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg> Escuchar
      `;
      speakBtn.title = 'Escuchar la voz del Profe Mapache';
      speakBtn.addEventListener('click', (e) => {
        e.preventDefault();
        speakText(cleanSpeech);
      });
      msgDiv.appendChild(speakBtn);

      if (isCallActive) {
        speakText(cleanSpeech);
      }
    }
  } else {
    msgDiv.innerText = text;
  }

  contentCol.appendChild(msgDiv);
  row.appendChild(avatarDiv);
  row.appendChild(contentCol);
  chatBox.appendChild(row);

  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 40);
}

// Toast de Recompensa de XP (Sin Emojis)
function showXPToast(amount, leveledUp, newLvl) {
  let toast = document.getElementById('xp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'xp-toast';
    toast.className = 'xp-toast';
    document.body.appendChild(toast);
  }
  toast.innerText = leveledUp
    ? `¡Nivel ${newLvl}! +${amount} XP`
    : `+${amount} XP`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// Envío de mensaje interactivo
async function sendMessage(overrideText = null) {
  if (isSending || !input) return;
  const text = (overrideText || input.value).trim();
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
    addMessage('bot', '¡Excelente pregunta! Vamos a resolverlo pasito a pasito. ¿Qué número o dato del ejercicio calculamos primero?');
  } finally {
    if (typing) typing.style.display = 'none';
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
    isSending = false;
  }
}

// Enviar Sticker Interactivo
function sendSticker(sticker) {
  if (isSending) return;
  const stickerPath = `img/${sticker.id}.png`;

  // Cerrar drawer
  if (stickerDrawer) stickerDrawer.classList.remove('open');

  // Añadir sticker como mensaje del usuario
  addMessage('user', '', true, stickerPath);

  // Profe Mapache responde cariñosamente al sticker
  if (typing) typing.style.display = 'flex';
  setTimeout(async () => {
    if (typing) typing.style.display = 'none';
    addMessage('bot', sticker.phrase);
    try {
      const xpRes = await addXP(30);
      showXPToast(30, xpRes.leveled, xpRes.lvl);
    } catch (_) {}
  }, 700);
}

// Inicializar Tray de Stickers
if (stickerGrid) {
  stickerGrid.innerHTML = mascotStickers.map(st => `
    <button class="sticker-option" data-id="${st.id}" title="${st.title}">
      <img src="img/${st.id}.png" alt="${st.title}" />
    </button>
  `).join('');

  stickerGrid.querySelectorAll('.sticker-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const stId = btn.getAttribute('data-id');
      const sticker = mascotStickers.find(s => s.id === stId);
      if (sticker) sendSticker(sticker);
    });
  });
}

if (toggleStickerBtn && stickerDrawer) {
  toggleStickerBtn.addEventListener('click', () => {
    stickerDrawer.classList.toggle('open');
  });
}

if (closeStickerBtn && stickerDrawer) {
  closeStickerBtn.addEventListener('click', () => {
    stickerDrawer.classList.remove('open');
  });
}

// Inicializar Chips de Ayuda Rápida
if (quickChipsBar) {
  quickChipsBar.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const promptText = btn.getAttribute('data-prompt');
      if (promptText) {
        sendMessage(promptText);
      }
    });
  });
}

// Ocultar Banner Hero con memoria de sesión
if (closeHeroBtn && chatHeroBanner) {
  if (sessionStorage.getItem('hide_chat_hero') === 'true') {
    chatHeroBanner.style.display = 'none';
  }
  closeHeroBtn.addEventListener('click', () => {
    chatHeroBanner.style.display = 'none';
    sessionStorage.setItem('hide_chat_hero', 'true');
  });
}

// Exponer funciones globales para llamadas
window.startVoiceCall = startVoiceCall;
window.endVoiceCall   = endVoiceCall;

if (new URLSearchParams(window.location.search).get('autocall') === 'true') {
  startVoiceCall();
}

// Modal de ajustes y clave api
if (openSettingsBtn && settingsModal) {
  openSettingsBtn.addEventListener('click', () => {
    const currentKey = localStorage.getItem('rt_gemini_key') || '';
    if (geminiKeyInput) geminiKeyInput.value = currentKey;
    if (keyFeedback) keyFeedback.textContent = currentKey ? '✓ Clave personalizada activa en tu navegador' : '';
    settingsModal.classList.add('active');
    settingsModal.setAttribute('aria-hidden', 'false');
  });
}

if (closeSettingsBtn && settingsModal) {
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    settingsModal.setAttribute('aria-hidden', 'true');
  });
}

if (saveKeyBtn && geminiKeyInput) {
  saveKeyBtn.addEventListener('click', () => {
    const val = geminiKeyInput.value.trim();
    if (val) {
      localStorage.setItem('rt_gemini_key', val);
      if (keyFeedback) {
        keyFeedback.textContent = 'Clave guardada correctamente';
        keyFeedback.style.color = '#00e676';
      }
    } else {
      localStorage.removeItem('rt_gemini_key');
      if (keyFeedback) {
        keyFeedback.textContent = 'Clave eliminada. Usando configuración por defecto.';
        keyFeedback.style.color = '#f5c842';
      }
    }
  });
}

// Motor Local de Respaldo Pedagógico (Sin Emojis)
function getLocalResponse(text, currentMode) {
  const msg = text.toLowerCase();

  if (currentMode === 'math') {
    if (msg.includes('multiplic') || msg.includes('*') || msg.includes('x') || msg.includes('tabla') || msg.includes('veces')) {
      return '**Multiplicar es sumar grupos iguales**.\n\nPor ejemplo: **3 × 4** significa tener **3 grupos de 4 elementos** (4 + 4 + 4 = 12).\n\n¿Qué números te gustaría multiplicar juntos?';
    }
    if (msg.includes('sum') || msg.includes('+') || msg.includes('mas') || msg.includes('juntar') || msg.includes('total')) {
      return '**Sumar es juntar o añadir cantidades**.\n\nSi tienes **15 lápices** y te regalan **10 más**, los unes todos: 15 + 10 = 25.\n\n¿Qué cantidades necesitas sumar?';
    }
    if (msg.includes('rest') || msg.includes('-') || msg.includes('menos') || msg.includes('quitar') || msg.includes('diferencia')) {
      return '**Restar es quitar o encontrar la diferencia**.\n\nSi tienes 10 manzanas y te comes 3, te quedan: 10 - 3 = 7.\n\n¿Qué resta estás resolviendo?';
    }
    if (msg.includes('divid') || msg.includes('/') || msg.includes('repartir')) {
      return '**Dividir es repartir en partes iguales**.\n\nSi tienes 12 dulces y 3 amigos, a cada uno le tocan: 12 ÷ 3 = 4.\n\n¿Entre cuántos quieres repartir?';
    }
    return 'En matemáticas vamos paso a paso. ¿Puedes escribir los números del ejercicio que estás resolviendo?';
  }

  if (currentMode === 'spanish') {
    if (msg.includes('sujeto') || msg.includes('predicado')) {
      return '**El Sujeto** es quién hace la acción (*"El perro"*), y el **Predicado** es qué hace (*"corre en el parque"*).\n\n¿Cuál es tu oración?';
    }
    if (msg.includes('verbo') || msg.includes('accion')) {
      return '**Los verbos son palabras de acción** como *correr, saltar, estudiar y reír*.\n\n¿Qué verbo buscas identificar?';
    }
    return 'El español es un idioma maravilloso. Cuéntame qué palabra, texto u oración estás estudiando.';
  }

  if (currentMode === 'english') {
    if (msg.includes('color')) return 'Colors in English: Red (Rojo), Blue (Azul), Yellow (Amarillo), Green (Verde). What is your favorite color?';
    if (msg.includes('numero') || msg.includes('number')) return 'Numbers in English: 1: One, 2: Two, 3: Three, 4: Four, 5: Five, 10: Ten! Let\'s count together!';
    return 'English is fun! What words or sentences do you want to practice today?';
  }

  if (currentMode === 'science') {
    return 'En ciencias exploramos el mundo que nos rodea. ¿Quieres estudiar plantas, animales, el cuerpo humano o el universo?';
  }

  if (currentMode === 'social') {
    return 'En sociales aprendemos sobre geografía, historia y culturas. ¿Sobre qué país o mapa tienes dudas?';
  }

  return '¡Excelente pregunta! Cuéntame los detalles del tema y lo resolvemos juntos paso a paso.';
}
