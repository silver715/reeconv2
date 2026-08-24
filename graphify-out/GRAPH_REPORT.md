# Graph Report - reeconv2  (2026-08-23)

## Corpus Check
- 19 files · ~36,272 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 154 nodes · 181 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e87d6440`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- xp.js
- chat.js
- auth.js
- avatars.js
- battlepass.js
- quiz.js
- 🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada
- gemini.js
- leaderboard.js
- env.example.js
- admin.js
- 🚀 Guía de Configuración Paso a Paso
- rules/graphify.md
- workflows/graphify.md
- 🔬 Arquitectura y Funcionamiento Técnico

## God Nodes (most connected - your core abstractions)
1. `assertReady()` - 14 edges
2. `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` - 10 edges
3. `✨ Características Principales` - 6 edges
4. `🔬 Arquitectura y Funcionamiento Técnico` - 6 edges
5. `persistAsync()` - 5 edges
6. `addXP()` - 5 edges
7. `🚀 Guía de Configuración Paso a Paso` - 5 edges
8. `handleSubmit()` - 4 edges
9. `init()` - 4 edges
10. `sendMessage()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `showResults()` --calls--> `addXP()`  [EXTRACTED]
  js/quiz.js → js/xp.js

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "xp.js"
Cohesion: 0.17
Nodes (21): addXP(), assertReady(), AVATARS, buyAvatar(), _cache, checkStreak(), getAvatar(), getAvatarData() (+13 more)

### Community 1 - "chat.js"
Cohesion: 0.15
Nodes (16): addMessage(), chatBox, conversationHistory, formatMarkdown(), getLocalResponse(), input, modeLabel, modeNames (+8 more)

### Community 2 - "auth.js"
Cohesion: 0.11
Nodes (20): cardSubTitle, errorMsg, handleSubmit(), loginBtn, modeText, nameGroup, nameInput, passwordInput (+12 more)

### Community 3 - "avatars.js"
Cohesion: 0.14
Nodes (11): avatarCategories, btnConfirmBuy, confirmModal, currentAvatarName, equippedAvatarImg, modalAvatarImg, modalAvatarName, modalAvatarPrice (+3 more)

### Community 4 - "battlepass.js"
Cohesion: 0.33
Nodes (8): init(), rarityBg, renderGrid(), renderStats(), renderTab(), renderXPBar(), typeClass, typeName

### Community 5 - "quiz.js"
Cohesion: 0.32
Nodes (7): currentQuestions, generateQuiz(), initQuiz(), questionsBank, renderQuestion(), showResults(), initXP()

### Community 6 - "🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada"
Cohesion: 0.14
Nodes (13): ✨ Características Principales, 🦝 Descripción General, 🎨 Diseño y Experiencia de Usuario (UI/UX), 📁 Estructura de Archivos del Proyecto, 🏆 Leaderboard / Ranking Global, 📄 Licencia y Créditos, 📚 Materias y Quizzes Disponibles, 📝 Quizzes Interactivos (+5 more)

### Community 14 - "admin.js"
Cohesion: 0.27
Nodes (9): ADMIN_EMAILS, allStudents, AVATAR_IMAGES, escapeHtml(), filteredStudents, loadAdminData(), renderStudentsTable(), showToast() (+1 more)

### Community 15 - "🚀 Guía de Configuración Paso a Paso"
Cohesion: 0.29
Nodes (7): 🚀 Guía de Configuración Paso a Paso, Opción A — Servidor Python (Incluido):, Opción B — Con VS Code:, Paso 1 — Configurar Firebase (Auth + Firestore), Paso 2 — Configurar Reglas de Seguridad (Security Rules), Paso 3 — Configurar Gemini API Key, Paso 4 — Ejecutar el Proyecto Localmente

### Community 18 - "🔬 Arquitectura y Funcionamiento Técnico"
Cohesion: 0.29
Nodes (7): 🔬 Arquitectura y Funcionamiento Técnico, Autenticación Simplificada para Niños, Diagrama de Secuencia del Chat:, Estructura de la Base de Datos (Firestore), Formateador de Markdown e Interfaz Educativa, Integración con Gemini API y Fallback Local, Motor de XP e Inmutabilidad de UI (`persistAsync`)

## Knowledge Gaps
- **76 isolated node(s):** `ADMIN_EMAILS`, `allStudents`, `filteredStudents`, `AVATAR_IMAGES`, `passwordInput` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` connect `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` to `🔬 Arquitectura y Funcionamiento Técnico`, `🚀 Guía de Configuración Paso a Paso`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `auth` connect `auth.js` to `xp.js`, `quiz.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `🔬 Arquitectura y Funcionamiento Técnico` connect `🔬 Arquitectura y Funcionamiento Técnico` to `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `ADMIN_EMAILS`, `allStudents`, `filteredStudents` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `chat.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Should `auth.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._
- **Should `avatars.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._