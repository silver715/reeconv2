/* ==============================================
   GEMINI API CLIENT — js/gemini.js (v2.1)
   Módulo limpio para Google Gemini API v1beta.
   ============================================== */

import { GEMINI_API_KEY, GEMINI_ENDPOINT } from './firebase-config.js?v=2.1';

const subjectLabels = {
  math:    'Matemáticas',
  spanish: 'Español (Lengua Castellana)',
  english: 'Inglés',
  science: 'Ciencias Naturales',
  social:  'Ciencias Sociales',
};

export async function askGemini(question, mode = 'math', grade = 'Primero') {
  const materia = subjectLabels[mode] || mode;

  const systemPrompt = `Eres Racoon Teacher 🦝, un tutor escolar amable, alegre y motivador para estudiantes de primaria en ${grade} grado.
Tu materia es ${materia}.

REGLAS DE RESPUESTA:
- Responde SIEMPRE en español de forma sencilla, comprensible y adaptada para niños de ${grade} grado.
- Usa emojis llamativos y divertidos (🦝, ⭐, 🍪, 📐, 🌱).
- Si el estudiante hace una pregunta o pide resolver un ejercicio, guíalo paso a paso con ejemplos cotidianos (juguetes, dulces, frutas).
- Mantén las respuestas claras y dinámicas (máximo 150 palabras).
- Termina con una pregunta motivadora para que el estudiante siga participando.`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: question }]
      }
    ],
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
      const errText = await res.text();
      console.warn(`[Gemini API Status ${res.status}]:`, errText);
      return null;
    }

    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (answer && answer.trim().length > 0) {
      return answer.trim();
    }

    return null;

  } catch (err) {
    console.warn('[Gemini Client Warning]:', err.message);
    return null;
  }
}
