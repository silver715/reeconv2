# 🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada

> **Proyecto Final de Grado**
> Tutor interactivo con Inteligencia Artificial (Google Gemini API) y sistema de progresión gamificado tipo Fortnite para estudiantes de educación primaria.

---

## 📋 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Características Principales](#-características-principales)
3. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
4. [Estructura de Archivos del Proyecto](#-estructura-de-archivos-del-proyecto)
5. [Guía de Configuración Paso a Paso](#-guía-de-configuración-paso-a-paso)
   - [Paso 1 — Configurar Firebase (Auth + Firestore)](#paso-1--configurar-firebase-auth--firestore)
   - [Paso 2 — Configurar Reglas de Seguridad (Security Rules)](#paso-2--configurar-reglas-de-seguridad-security-rules)
   - [Paso 3 — Configurar Gemini API Key](#paso-3--configurar-gemini-api-key)
   - [Paso 4 — Ejecutar el Proyecto Localmente](#paso-4--ejecutar-el-proyecto-localmente)
6. [Arquitectura y Funcionamiento Técnico](#-arquitectura-y-funcionamiento-técnico)
   - [Estructura de la Base de Datos (Firestore)](#estructura-de-la-base-de-datos-firestore)
   - [Integración con Gemini API y Fallback Local](#integración-con-gemini-api-y-fallback-local)
   - [Motor de XP e Inmutabilidad de UI (`persistAsync`)](#motor-de-xp-e-inmutabilidad-de-ui-persistasync)
   - [Formateador de Markdown e Interfaz Educativa](#formateador-de-markdown-e-interfaz-educativa)
   - [Autenticación Simplificada para Niños](#autenticación-simplificada-para-niños)
7. [Materias y Quizzes Disponibles](#-materias-y-quizzes-disponibles)
8. [Licencia y Créditos](#-licencia-y-créditos)

---

## 🦝 Descripción General

**Racoon Teacher** es una aplicación web progresiva diseñada para hacer del aprendizaje escolar una experiencia divertida e interactiva para niños de primaria (Transición a 4° grado).

Combina un **tutor IA amigable en español** ("El Profe Mapache 🦝") que guía a los estudiantes paso a paso sin darles las respuestas directas, con un **sistema de gamificación completo** inspirado en videojuegos populares como Fortnite:
- Pase de Batalla con 100 niveles y 29 recompensas.
- Quizzes interactivos por materia con estrellas y puntuaciones.
- Ranking en tiempo real entre estudiantes.
- Tienda de avatares personalizables comprables con la moneda virtual (V-Mapaches 💎).
- Sistema de racha diaria que recompensa el hábito de estudio continuo.

---

## ✨ Características Principales

### 🧠 Tutor Educativo con IA (Gemini API `gemini-flash-latest`)
- Respuestas inteligentes adaptadas al **grado escolar** y la **materia** del estudiante.
- Prompting educativo especializado utilizando el esquema oficial `systemInstruction` de la API de Gemini.
- Presupuesto extendido de tokens (`maxOutputTokens: 1500`) para acomodar tokens de pensamiento (*Chain of Thought*) y generar explicaciones didácticas con ejemplos de la vida cotidiana.
- **Motor de respuestas local de respaldo (Fallback)**: Si no hay conexión a internet o la cuota de la API se agota, la app continúa funcionando transparentemente con un motor de reglas predefinido en español.

### 🎮 Sistema de Gamificación Completo
- **Pase de Batalla**: 100 niveles con recompensas de distintas raridades (Común, Poco Común, Rara, Épica, Legendaria) divididas en pistas Gratis y Pro.
- **V-Mapaches (💎)**: Moneda virtual obtenida al subir de nivel y completar actividades.
- **Racha Diaria (🔥)**: Detección automática de días consecutivos de estudio con multiplicadores de XP (+50 XP extra por 3+ días, +100 XP por 7+ días).
- **Tienda de Avatares (🎭)**: 10 avatares temáticos (Científico, Ninja, Astronauta, Robot, Dorado, etc.) que los estudiantes pueden comprar y equipar.

### 📝 Quizzes Interactivos
- Evaluaciones divertidas de 5 preguntas aleatorias por materia.
- Retroalimentación visual inmediata (verde/rojo con animación de error).
- Puntuación con estrellas (⭐) y recompensas de XP (+100 XP por respuesta correcta, +200 XP bonus por puntaje perfecto).

### 🏆 Leaderboard / Ranking Global
- Tabla de clasificación en tiempo real entre estudiantes en base a su nivel y XP acumulada.
- Podio destacado para los 3 primeros lugares (🥇 🥈 🥉).
- Resaltado automático de la posición del estudiante activo.

### 🎨 Diseño y Experiencia de Usuario (UI/UX)
- Tema oscuro gamificado ("cyberpunk educativo") con colores armónicos y alta accesibilidad.
- Transiciones de página suaves (`navigateTo()`) con animaciones `fadeInPage` y `fadeOutPage`.
- Formateador de Markdown integrado en el chat para renderizar negritas, cursivas, listas y citas didácticas.
- **100% Responsive**: Adaptado para teléfonos móviles (hasta 360px de ancho), tabletas y computadores.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5 Semántico, Vanilla CSS3 (Variables CSS, Flexbox, CSS Grid, Animaciones keyframes), JavaScript ES Modules (ES6+).
- **Backend as a Service (BaaS)**: Google Firebase SDK v10.12.2.
  - **Firebase Authentication**: Gestión de sesiones de usuario.
  - **Cloud Firestore**: Base de datos NoSQL en tiempo real para perfiles y progreso.
- **Inteligencia Artificial**: Google Gemini API (`gemini-flash-latest`).
- **Fuentes**: Google Fonts (*Baloo 2* y *Nunito*).

---

## 📁 Estructura de Archivos del Proyecto

```
racoon-teacher/
├── index.html              ← Menú principal / Dashboard con acceso a todas las secciones
├── chat.html               ← Pantalla del chat tutor con la IA
├── battlepass.html          ← Pantalla del Pase de Batalla y recompensas
├── quiz.html               ← Pantalla de quizzes interactivos por materia
├── leaderboard.html        ← Pantalla del Ranking / Tabla de clasificación
├── avatars.html            ← Pantalla de la Tienda de Avatares
├── user.html               ← Pantalla de Iniciar Sesión y Registro
├── landing.html             ← Página de bienvenida pública para nuevos visitantes
├── firestore.rules         ← Reglas de seguridad para Firestore Database
├── img/                    ← Directorio de imágenes optimizadas del proyecto
│   ├── logo_raccoon.jpeg
│   ├── hero_raccoon.jpeg
│   ├── feature_1.jpeg
│   └── ...
├── css/
│   ├── style.css           ← Variables globales, botones y estructura base
│   ├── chat.css            ← Estilos exclusivos de la interfaz de chat, citas y toasts
│   ├── battlepass.css      ← Estilos del Pase de Batalla (responsive)
│   ├── user.css            ← Estilos de la tarjeta de inicio de sesión
│   ├── landing.css         ← Estilos de la landing page pública
│   ├── quiz.css            ← Estilos de la interfaz de preguntas y tarjetas
│   ├── leaderboard.css    ← Estilos del podio y la tabla de clasificación
│   ├── avatars.css        ← Estilos de la tienda y tarjetas de avatares
│   └── transitions.css    ← Animaciones de transición entre páginas
├── js/
│   ├── firebase-config.js  ← Configuración de Firebase y Gemini API key
│   ├── gemini.js           ← Cliente API para Gemini (systemInstruction + maxOutputTokens)
│   ├── xp.js               ← Motor de XP instantáneo con persistencia asíncrona (persistAsync)
│   ├── auth.js             ← Lógica de inicio de sesión y registro de usuarios
│   ├── menu.js             ← Lógica del dashboard, racha diaria y modal de grado
│   ├── chat.js             ← Lógica del chat, formateador Markdown y fallback local
│   ├── battlepass.js       ← Renderizado dinámico del Pase de Batalla
│   ├── quiz.js             ← Banco de preguntas, motor de quiz y recompensas
│   ├── leaderboard.js     ← Consulta y renderizado del Ranking en tiempo real
│   ├── avatars.js         ← Lógica de compra y equipamiento de avatares
│   ├── nav.js              ← Helper para transmisión de materia en navegación
│   └── transitions.js    ← Control de transiciones de página suaves (navigateTo)
└── README.md               ← Documentación completa del proyecto
```

---

## 🚀 Guía de Configuración Paso a Paso

### Paso 1 — Configurar Firebase (Auth + Firestore)

1. Entra a **[Firebase Console](https://console.firebase.google.com)** con tu cuenta de Google.
2. Clic en **"Agregar proyecto"** → Asigna un nombre (ej. `racoon-teacher`) → Desactiva Google Analytics (opcional) → **Crear proyecto**.
3. En el panel izquierdo, ve a **Authentication**:
   - Pestaña **"Sign-in method"** → Clic en **"Correo electrónico/contraseña"** → Activa el interruptor **Habilitar** → Guardar.
4. En el panel izquierdo, ve a **Firestore Database**:
   - Clic en **"Crear base de datos"** → Selecciona modo **Producción** → Elige la ubicación más cercana → Crear.
5. Registra tu aplicación web:
   - Ve a **Configuración del proyecto** (ícono de engranaje ⚙️ arriba a la izquierda).
   - En la sección "Tus apps", haz clic en el ícono **`</>`** (Web).
   - Asigna un nombre (ej. `racoon-web`) → Clic en **Registrar app**.
   - Firebase generará un objeto `firebaseConfig`. Copia esos datos.
6. Pega tus credenciales en `js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

### Paso 2 — Configurar Reglas de Seguridad (Security Rules)

Las reglas de seguridad garantizan que cada estudiante solo pueda modificar su propio progreso, mientras permiten la lectura pública autenticada para el Leaderboard.

1. En la consola de Firebase, ve a **Firestore Database** → pestaña **"Reglas"**.
2. Reemplaza todo el contenido con el archivo `firestore.rules` del proyecto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Colección users: cada usuario gestiona su propio perfil
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Colección progress: cada usuario gestiona su propio progreso (XP, racha, avatares)
    match /progress/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. Haz clic en **"Publicar"**.

---

### Paso 3 — Configurar Gemini API Key

1. Accede a **[Google AI Studio](https://aistudio.google.com)**.
2. Inicia sesión con tu cuenta de Google.
3. Clic en **"Get API key"** (menú izquierdo) → **"Create API key"**.
4. Copia la clave generada (comenzará con el prefijo `AIzaSy...`).
5. Abre `js/firebase-config.js` y asigna la clave a la constante `GEMINI_API_KEY`:

```javascript
export const GEMINI_API_KEY = "AIzaSyBRiiaU6aqWbXLJynb4Qx-phbIKs41HjA0";
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
```

---

### Paso 4 — Ejecutar el Proyecto Localmente

Debido al uso de módulos ES6 (`import`/`export`), los navegadores bloquean la ejecución directa mediante el protocolo `file://`. Se requiere un servidor web local:

#### Opción A — Servidor Python (Incluido):
```bash
python -m http.server 3000
```
Abre en tu navegador: `http://localhost:3000/landing.html`.

#### Opción B — Con VS Code:
1. Instala la extensión **Live Server** en VS Code.
2. Clic derecho sobre `landing.html` → **"Open with Live Server"**.

---

## 🔬 Arquitectura y Funcionamiento Técnico

### Estructura de la Base de Datos (Firestore)

La base de datos utiliza dos colecciones principales vinculadas por el `uid` del usuario de Firebase Authentication:

```
Firestore Root
├── 📁 users/{uid}
│     ├── name: "Carlos Pérez"        (string)
│     ├── username: "carlitos123"     (string)
│     └── createdAt: 1723145000000    (number, timestamp)
│
└── 📁 progress/{uid}
      ├── xp: 450                     (number, 0-999)
      ├── lvl: 12                     (number, 1-100)
      ├── vb: 1300                    (number, V-Mapaches)
      ├── streak: 5                   (number, días consecutivos)
      ├── lastActiveDate: "2026-08-08"(string, YYYY-MM-DD)
      ├── avatar: "raccoon_ninja"     (string, ID del avatar activo)
      └── unlockedAvatars: [...]      (array de strings, IDs desbloqueados)
```

---

### Integración con Gemini API y Fallback Local

El módulo `js/gemini.js` administra las peticiones a la API de Google Gemini enviando las instrucciones pedagógicas a través del objeto nativo `systemInstruction`:

```javascript
const body = {
  systemInstruction: {
    parts: [{ text: systemPrompt }]
  },
  contents: [
    { role: "user", parts: [{ text: question }] }
  ],
  generationConfig: {
    maxOutputTokens: 1500,
    temperature: 0.7
  }
};
```

#### Diagrama de Secuencia del Chat:

```mermaid
sequenceDiagram
    autonumber
    actor Estudiante
    participant ChatUI as chat.js
    participant Gemini as gemini.js
    participant GoogleAI as Gemini API
    participant LocalEngine as Local Rule Engine

    Estudiante->>ChatUI: Envía mensaje ("¿Cómo se multiplica?")
    ChatUI->>Gemini: askGemini(pregunta, materia, grado)
    Gemini->>GoogleAI: POST fetch (systemInstruction + maxOutputTokens: 1500)
    
    alt Respuesta Exitosa de la IA
        GoogleAI-->>Gemini: 200 OK + Texto generado
        Gemini-->>ChatUI: Respuesta didáctica completa
    else Error de Red / Cuota Excedida / Offline
        GoogleAI-->>Gemini: Error / Null
        Gemini-->>ChatUI: null
        ChatUI->>LocalEngine: smartLocal() / localExtended()
        LocalEngine-->>ChatUI: Respuesta local predefinida
    end
    
    ChatUI->>ChatUI: formatMarkdown() (HTML enriquecido)
    ChatUI-->>Estudiante: Renderiza respuesta en pantalla + Otorga XP (persistAsync)
```

---

### Motor de XP e Inmutabilidad de UI (`persistAsync`)

1. **Inmediatez (0ms Latency)**: Para garantizar que el chat no sufra retrasos ni bloqueos causados por reintentos de red o reglas de base de datos pendientes, `addXP()` actualiza la memoria local (`_cache`) de forma síncrona e instantánea.
2. **Persistencia Asíncrona No Bloqueante**: La sincronización con Cloud Firestore se delega a `persistAsync()`, ejecutada en segundo plano mediante `setDoc(ref, _cache, { merge: true }).catch(() => {})`. Esto asegura que las advertencias de red nunca detengan la experiencia del estudiante.

---

### Formateador de Markdown e Interfaz Educativa

El módulo `js/chat.js` incluye una función de renderizado `formatMarkdown()` que convierte el texto en formato Markdown de Gemini en elementos HTML accesibles y estilizados:
- `**texto**` $\rightarrow$ `<strong>texto</strong>` (Negritas para resaltar conceptos clave).
- `*texto*` $\rightarrow$ `<em>texto</em>` (Cursivas para énfasis).
- `> texto` $\rightarrow$ `<blockquote class="chat-quote">texto</blockquote>` (Citas destacadas).
- `\n` $\rightarrow$ `<br>` (Saltos de línea limpios).

---

### Autenticación Simplificada para Niños

Para evitar que los niños de primaria necesiten correos electrónicos reales, el módulo `js/auth.js` convierte cualquier nombre de usuario simple (ej. `pedrito`) en una dirección interna sintética:

$$\text{email} = \text{username.toLowerCase()} + \text{"@racoon.local"}$$

Esto permite aprovechar la seguridad de Firebase Authentication sin imponer barreras a los estudiantes.

---

## 📚 Materias y Quizzes Disponibles

| Materia | Ícono | Temas de Tutoría | Quizzes Incluidos |
|---|:---:|---|---|
| **Matemáticas** | 📐 | Sumas, restas, multiplicaciones, fracciones, geometría | 6 preguntas con cálculo y lógica |
| **Español** | ✍️ | Sujeto, predicado, verbos, sustantivos, ortografía, sinónimos | 6 preguntas de gramática y lectura |
| **Inglés** | 🌐 | Vocabulario, saludos, colores, números, pronombres, verbos | 6 preguntas de traducción y frases |
| **Ciencias Naturales** | 🌱 | Fotosíntesis, animales, seres vivos, ciclo del agua, cuerpo humano | 6 preguntas de biología y naturaleza |
| **Sociales** | 🗺️ | Geografía, mapas, historia de América, culturas indígenas, democracia | 6 preguntas de historia y sociedad |

---

## 📄 Licencia y Créditos

Este proyecto fue desarrollado como **Proyecto Final de Grado**.

- **Iconografía y Emojis**: Noto Color Emoji / Emojis del sistema.
- **Fuentes**: *Baloo 2* y *Nunito* bajo Licencia SIL Open Font.
- **Backend & IA**: Google Firebase & Google Gemini API.

*¡Racoon Teacher — Hecho con ❤️ para la educación primaria!* 🦝✨
