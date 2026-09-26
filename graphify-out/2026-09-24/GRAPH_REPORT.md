# Graph Report - reeconv2  (2026-09-18)

## Corpus Check
- 19 files · ~77,696 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 11, (none) 1, .rules 1)

## Summary
- 203 nodes · 261 edges · 16 communities (10 shown, 6 thin omitted)
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
- firebase-config.js
- 🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada
- gemini.js
- env.example.js
- 🚀 Guía de Configuración Paso a Paso
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
8. `🚀 Guía de Configuración Paso a Paso` - 5 edges
9. `handleSubmit()` - 4 edges
10. `init()` - 4 edges

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
Cohesion: 0.15
Nodes (15): cardSubTitle, errorMsg, handleSubmit(), loginBtn, modeText, nameGroup, nameInput, passwordInput (+7 more)

### Community 3 - "avatars.js"
Cohesion: 0.13
Nodes (12): avatarCategories, btnConfirmBuy, confirmModal, currentAvatarName, equippedAvatarImg, modalAvatarImg, modalAvatarName, modalAvatarPrice (+4 more)

### Community 4 - "battlepass.js"
Cohesion: 0.25
Nodes (10): init(), rarityBg, renderGrid(), renderStats(), renderTab(), renderXPBar(), typeClass, typeName (+2 more)

### Community 5 - "firebase-config.js"
Cohesion: 0.14
Nodes (15): app, auth, db, firebaseConfig, GEMINI_API_KEY, GEMINI_ENDPOINT, currentQuestions, generateQuiz() (+7 more)

### Community 6 - "🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada"
Cohesion: 0.10
Nodes (19): navigateTo(), 🔬 Arquitectura y Funcionamiento Técnico, Autenticación Simplificada para Niños, ✨ Características Principales, 🦝 Descripción General, Diagrama de Secuencia del Chat:, 🎨 Diseño y Experiencia de Usuario (UI/UX), 📁 Estructura de Archivos del Proyecto (+11 more)

### Community 7 - "gemini.js"
Cohesion: 0.33
Nodes (3): CANDIDATE_MODELS, subjectLabels, ref_firebase_config_js_v_3_9

### Community 13 - "🚀 Guía de Configuración Paso a Paso"
Cohesion: 0.25
Nodes (8): 🚀 Guía de Configuración Paso a Paso, Opción A — Con Python (Recomendada y sin instalar nada extra):, Opción B — Con Node.js / NPX:, Opción C — Con VS Code:, Paso 1 — Configurar Firebase (Auth + Firestore), Paso 2 — Configurar Reglas de Seguridad (Security Rules), Paso 3 — Configurar Gemini API Key, Paso 4 — Ejecutar el Proyecto en Cualquier Computador

### Community 14 - "admin.js"
Cohesion: 0.11
Nodes (17): ADMIN_EMAILS, allStudents, AVATAR_IMAGES, escapeHtml(), filteredStudents, loadAdminData(), renderStudentsTable(), showToast() (+9 more)

## Knowledge Gaps
- **97 isolated node(s):** `ADMIN_EMAILS`, `allStudents`, `filteredStudents`, `AVATAR_IMAGES`, `passwordInput` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 125 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` connect `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` to `🚀 Guía de Configuración Paso a Paso`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `🔬 Arquitectura y Funcionamiento Técnico` connect `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` to `xp.js`, `chat.js`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `persistAsync()` connect `xp.js` to `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `persistAsync()` (e.g. with `Motor de XP e Inmutabilidad de UI (`persistAsync`)` and `📋 Tabla de Contenidos`) actually correct?**
  _`persistAsync()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ADMIN_EMAILS`, `allStudents`, `filteredStudents` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `chat.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05230496453900709 - nodes in this community are weakly interconnected._
- **Should `avatars.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._