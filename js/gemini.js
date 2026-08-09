/* ==============================
   GEMINI — js/gemini.js
   Cliente para la API de Gemini (Google AI).
   Envía las preguntas del estudiante y recibe respuestas
   inteligentes adaptadas a la materia y grado.
   Si la API falla, retorna null para usar el motor local como fallback.
   ============================== */

import { GEMINI_API_KEY, GEMINI_ENDPOINT } from './firebase-config.js';

/* ── Nombres de materias para el prompt ── */
const modeSubjects = {
  math:    'Matemáticas',
  spanish: 'Español (Lengua Castellana)',
  english: 'Inglés',
  science: 'Ciencias Naturales',
  social:  'Ciencias Sociales',
};

/* ── Función principal: enviar pregunta a Gemini ──
   Parámetros:
   - question: texto del estudiante
   - mode: materia seleccionada (math, spanish, english, science, social)
   - grade: grado escolar (Transición, Primero, Segundo, Tercero, Cuarto)
   
   Retorna: string con la respuesta de Gemini, o null si hay error */
export async function askGemini(question, mode, grade) {
  const materia = modeSubjects[mode] || mode;

  /* System prompt adaptado al contexto educativo.
     Le indicamos a Gemini que es un tutor de primaria,
     la materia específica y el grado del estudiante. */
  const systemPrompt = `Eres Racoon Teacher 🦝, un tutor amigable y motivador para estudiantes de primaria en ${grade} grado.
Tu materia es ${materia}. 

REGLAS IMPORTANTES:
- Responde SIEMPRE en español de forma clara, sencilla y adaptada a la edad del estudiante.
- Usa emojis para hacer las explicaciones más divertidas y visuales.
- Limita tus respuestas a máximo 150 palabras.
- Si el estudiante envía una operación matemática, guíalo paso a paso SIN dar la respuesta directa. Pregúntale qué cree que debe hacer.
- Si el estudiante responde correctamente, felicítalo con entusiasmo.
- Si se equivoca, anímalo a intentar de nuevo con una pista.
- No uses lenguaje técnico complejo. Explica como si hablaras con un niño.
- Siempre termina con una pregunta o invitación a seguir aprendiendo.
- NUNCA generes contenido inapropiado para niños.`;

  /* Cuerpo de la petición a la API de Gemini (Estructura oficial v1beta) */
  const body = {
    systemInstruction: {
      parts: [
        { text: systemPrompt }
      ]
    },
    contents: [
      {
        role: "user",
        parts: [
          { text: question }
        ]
      }
    ],
    generationConfig: {
      maxOutputTokens: 1500,   // Espacio suficiente para tokens de razonamiento + respuesta
      temperature: 0.7,        // Balance entre creatividad y coherencia
      topP: 0.9
    },
    /* Filtros de seguridad para contenido infantil */
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",         threshold: "BLOCK_LOW_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_LOW_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_LOW_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_LOW_AND_ABOVE" },
    ]
  };

  try {
    /* AbortController para timeout de 10 segundos.
       Evita que el usuario espere demasiado si hay problemas de red. */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[Gemini API] Cuota de API excedida o la API Key no tiene permisos en Google AI Studio (Error 429). Se utilizará el motor local de respuestas.');
      } else {
        console.warn(`[Gemini API] Error ${response.status}. Se utilizará el motor local de respuestas.`);
      }
      return null; // Fallback al motor local
    }

    const data = await response.json();

    /* Extraer el texto de la respuesta de Gemini.
       La estructura es: data.candidates[0].content.parts[0].text */
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('Gemini: respuesta vacía o bloqueada por filtros de seguridad');
      return null;
    }

    return text.trim();

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Gemini: timeout de 10 segundos alcanzado');
    } else {
      console.warn('Gemini: error de conexión:', error.message);
    }
    return null; // Fallback al motor local
  }
}
