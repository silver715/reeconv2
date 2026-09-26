// Cliente de Gemini AI: consultas pedagógicas y llamadas de voz en tiempo real

import { GEMINI_API_KEY, GEMINI_ENDPOINT } from './firebase-config.js?v=3.9';

const subjectLabels = {
  math:    'Matemáticas',
  spanish: 'Español (Lengua Castellana)',
  english: 'Inglés',
  science: 'Ciencias Naturales',
  social:  'Ciencias Sociales',
};

// Modelos disponibles ordenados por estabilidad comprobada y menor saturación en la API de Google
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest'
];

export async function askGemini(question, mode = 'math', grade = 'Primero', history = []) {
  const materia = subjectLabels[mode] || mode;

  const systemPrompt = `Eres Racoon Teacher, un tutor escolar amable, claro y motivador para estudiantes de primaria en ${grade} grado.
Tu materia es ${materia}.

REGLAS DE RESPUESTA:
- Responde SIEMPRE en español de forma sencilla, didáctica y adaptada para niños de ${grade} grado.
- NO uses emojis ni emoticonos en tus respuestas; mantén una redacción limpia, clara, estructurada y profesional pero siempre cercana y amigable.
- Si el estudiante envía un ejercicio o duda, guíalo paso a paso con ejemplos cotidianos sin darle la respuesta de inmediato si es una prueba.
- Mantén las respuestas dinámicas y agradables (máximo 150 palabras).
- Recuerda los mensajes anteriores para dar continuidad a la explicación.
- Termina con una pregunta o invitación amigable a seguir practicando.`;

  // Asegurar formato de contents con historial previo sanitizado
  const formattedHistory = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-8)) { // Máximo últimos 8 mensajes para no saturar tokens
      if (item && item.role && item.text) {
        formattedHistory.push({
          role: item.role === 'model' || item.role === 'bot' ? 'model' : 'user',
          parts: [{ text: item.text }]
        });
      }
    }
  }

  // Agregar la pregunta actual del usuario
  formattedHistory.push({
    role: 'user',
    parts: [{ text: question }]
  });

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: formattedHistory,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7
    }
  };

  const activeKey = localStorage.getItem("rt_gemini_key") || GEMINI_API_KEY;

  if (!activeKey || activeKey === "TU_GEMINI_API_KEY_AQUI" || activeKey.trim().length === 0) {
    console.info("[Gemini] No se ha configurado una API Key válida. Usando motor pedagógico local.");
    return null;
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (res.status === 503 || res.status === 429) {
        // Demanda alta temporal en este modelo específico de Google, probar el siguiente de inmediato
        continue;
      }

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (answer && answer.trim().length > 0) {
        return answer.trim();
      }
    } catch (_) {
      // Continuar al siguiente modelo candidato o respaldo pedagógico local
    }
  }

  return null;
}

// Consulta de voz en vivo para la llamada interactiva
export async function askGeminiVoice(question, mode = 'math', grade = 'Primero', history = []) {
  const materia = subjectLabels[mode] || mode;

  const voiceSystemPrompt = `Eres Racoon Teacher, el tutor escolar de primaria conversando en una llamada de voz en tiempo real con un niño de ${grade} grado.
Tu materia actual es ${materia}.

INSTRUCCIONES PARA LA LLAMADA EN AUDIO:
- Responde de forma natural, cálida, entusiasta y amigable, como una verdadera llamada telefónica educativa.
- Explica de forma clara, motivadora y paso a paso. No acortes artificialmente las explicaciones si el niño necesita entender el concepto, pero habla con oraciones fluidas y agradables de escuchar.
- IMPORTANTE: NO uses emojis ni emoticonos bajo ninguna circunstancia.
- IMPORTANTE: NO uses formato Markdown (nada de asteriscos **, viñetas con guiones, numerales # ni tablas), ya que tu respuesta será sintetizada a voz en voz alta por el navegador. Usa texto limpio y hablado.
- Si el niño acierta o tiene una duda, anímalo con entusiasmo y hazle una pregunta de seguimiento para mantener la conversación viva y entretenida.`;

  const formattedHistory = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if (item && item.role && item.text) {
        formattedHistory.push({
          role: item.role === 'model' || item.role === 'bot' ? 'model' : 'user',
          parts: [{ text: item.text }]
        });
      }
    }
  }

  formattedHistory.push({
    role: 'user',
    parts: [{ text: question }]
  });

  const payload = {
    systemInstruction: {
      parts: [{ text: voiceSystemPrompt }]
    },
    contents: formattedHistory,
    generationConfig: {
      maxOutputTokens: 350,
      temperature: 0.75
    }
  };

  const activeKey = localStorage.getItem("rt_gemini_key") || GEMINI_API_KEY;

  if (!activeKey || activeKey === "TU_GEMINI_API_KEY_AQUI" || activeKey.trim().length === 0) {
    return null;
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (res.status === 503 || res.status === 429) {
        continue;
      }

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (answer && answer.trim().length > 0) {
        // Limpiar cualquier markdown residual para síntesis limpia de voz
        return answer
          .replace(/[*#_`~>]/g, '')
          .replace(/\n+/g, ' ')
          .trim();
      }
    } catch (_) {
      // Continuar al siguiente modelo candidato
    }
  }

  return null;
}

