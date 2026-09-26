# Graph Report - reeconv2  (2026-09-25)

## Corpus Check
- 19 files · ~90,578 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 11, .jfif 10, (none) 1)

## Summary
- 213 nodes · 274 edges · 16 communities (10 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f7add26c`
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
- ✨ Características Principales
- env.example.js
- admin.js
- rules/graphify.md
- workflows/graphify.md
- initPeekingMascots

## God Nodes (most connected - your core abstractions)
1. `assertReady()` - 14 edges
2. `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` - 10 edges
3. `addMessage()` - 7 edges
4. `persistAsync()` - 7 edges
5. `addXP()` - 6 edges
6. `✨ Características Principales` - 6 edges
7. `🔬 Arquitectura y Funcionamiento Técnico` - 6 edges
8. `initQuiz()` - 5 edges
9. `🚀 Guía de Configuración Paso a Paso` - 5 edges
10. `handleSubmit()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `📋 Tabla de Contenidos` --references--> `persistAsync()`  [INFERRED]
  README.md → js/xp.js
- `Formateador de Markdown e Interfaz Educativa` --references--> `formatMarkdown()`  [INFERRED]
  README.md → js/chat.js
- `🎨 Diseño y Experiencia de Usuario (UI/UX)` --references--> `navigateTo()`  [INFERRED]
  README.md → js/transitions.js
- `Motor de XP e Inmutabilidad de UI (`persistAsync`)` --references--> `persistAsync()`  [INFERRED]
  README.md → js/xp.js
- `Motor de XP e Inmutabilidad de UI (`persistAsync`)` --references--> `addXP()`  [INFERRED]
  README.md → js/xp.js

## Import Cycles
- None detected.

## Communities (16 total, 6 thin omitted)

### Community 0 - "xp.js"
Cohesion: 0.16
Nodes (22): addXP(), assertReady(), AVATARS, buyAvatar(), _cache, checkStreak(), getAvatar(), getAvatarData() (+14 more)

### Community 1 - "chat.js"
Cohesion: 0.05
Nodes (47): addMessage(), bannerHangupBtn, callBannerStatus, callBtn, callTimerEl, callWaveBars, chatBox, chatHeroBanner (+39 more)

### Community 2 - "auth.js"
Cohesion: 0.08
Nodes (26): cardSubTitle, emailInput, errorMsg, handleSubmit(), loginBtn, modeText, nameGroup, nameInput (+18 more)

### Community 3 - "avatars.js"
Cohesion: 0.12
Nodes (13): avatarCategories, btnConfirmBuy, confirmModal, currentAvatarName, equippedAvatarImg, modalAvatarImg, modalAvatarName, modalAvatarPrice (+5 more)

### Community 4 - "battlepass.js"
Cohesion: 0.36
Nodes (7): init(), rarityBg, renderGrid(), renderStats(), renderXPBar(), ref_firebase_config_js_v_2_3, ref_xp_js_v_2_9

### Community 5 - "quiz.js"
Cohesion: 0.17
Nodes (14): correctPhrases, currentQuestions, generateQuiz(), idlePhrases, incorrectPhrases, initQuiz(), questionsBank, renderQuestion() (+6 more)

### Community 6 - "🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada"
Cohesion: 0.10
Nodes (20): 🔬 Arquitectura y Funcionamiento Técnico, Autenticación Simplificada para Niños, 🦝 Descripción General, Diagrama de Secuencia del Chat:, 📁 Estructura de Archivos del Proyecto, Estructura de la Base de Datos (Firestore), 🚀 Guía de Configuración Paso a Paso, Integración con Gemini API y Fallback Local (+12 more)

### Community 7 - "gemini.js"
Cohesion: 0.33
Nodes (3): CANDIDATE_MODELS, subjectLabels, ref_firebase_config_js_v_3_9

### Community 8 - "✨ Características Principales"
Cohesion: 0.25
Nodes (7): navigateTo(), ✨ Características Principales, 🎨 Diseño y Experiencia de Usuario (UI/UX), 🏆 Leaderboard / Ranking Global, 📝 Quizzes Interactivos, 🎮 Sistema de Gamificación Completo, 🧠 Tutor Educativo con IA (Gemini API `gemini-flash-latest`)

### Community 14 - "admin.js"
Cohesion: 0.11
Nodes (17): ADMIN_EMAILS, allStudents, AVATAR_IMAGES, escapeHtml(), filteredStudents, loadAdminData(), renderStudentsTable(), showToast() (+9 more)

## Knowledge Gaps
- **102 isolated node(s):** `ADMIN_EMAILS`, `allStudents`, `filteredStudents`, `AVATAR_IMAGES`, `emailInput` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 134 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` connect `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` to `✨ Características Principales`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `persistAsync()` connect `xp.js` to `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `🔬 Arquitectura y Funcionamiento Técnico` connect `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` to `xp.js`, `chat.js`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `persistAsync()` (e.g. with `Motor de XP e Inmutabilidad de UI (`persistAsync`)` and `📋 Tabla de Contenidos`) actually correct?**
  _`persistAsync()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ADMIN_EMAILS`, `allStudents`, `filteredStudents` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `chat.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05230496453900709 - nodes in this community are weakly interconnected._
- **Should `auth.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0812807881773399 - nodes in this community are weakly interconnected._