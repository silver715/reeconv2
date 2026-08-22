/* ==============================================
   GEMINI API CLIENT — js/gemini.js (v2.3 Multiturno)
   Cliente para Google Gemini API v1beta con memoria
   de conversación (Multi-turn Context) y resiliencia.
   ============================================== */

import { GEMINI_API_KEY, GEMINI_ENDPOINT } from './firebase-config.js?v=2.3';

const subjectLabels = {
  math:    'Matemáticas',
  spanish: 'Español (Lengua Castellana)',
  english: 'Inglés',
  science: 'Ciencias Naturales',
  social:  'Ciencias Sociales',
};

export async function askGemini(question, mode = 'math', grade = 'Primero', history = []) {
  const materia = subjectLabels[mode] || mode;

  const systemPrompt = `Eres Racoon Teacher 🦝, un tutor escolar amable, alegre y motivador para estudiantes de primaria en ${grade} grado.
Tu materia es ${materia}.

REGLAS DE RESPUESTA:
- Responde SIEMPRE en español de forma sencilla, didáctica y adaptada para niños de ${grade} grado.
- Usa emojis llamativos y divertidos (🦝, ⭐, 🍪, 📐, 🌱, 🚀).
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

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const url = `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text();
      console.warn(`[Gemini API Warning ${res.status}]:`, errBody);
      return null;
    }

    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (answer && answer.trim().length > 0) {
      return answer.trim();
    }

    return null;

  } catch (err) {
    console.warn('[Gemini Connection Warning]:', err.message);
    return null;
  }
}
