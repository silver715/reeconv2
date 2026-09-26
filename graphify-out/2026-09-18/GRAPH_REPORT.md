# Graph Report - reeconv2  (2026-09-14)

## Corpus Check
- 19 files · ~77,696 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 188 nodes · 223 edges · 19 communities (13 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
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
- leaderboard.js
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
4. `✨ Características Principales` - 6 edges
5. `🔬 Arquitectura y Funcionamiento Técnico` - 6 edges
6. `persistAsync()` - 5 edges
7. `addXP()` - 5 edges
8. `🚀 Guía de Configuración Paso a Paso` - 5 edges
9. `handleSubmit()` - 4 edges
10. `init()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `showResults()` --calls--> `addXP()`  [EXTRACTED]
  js/quiz.js → js/xp.js

## Import Cycles
- None detected.

## Communities (19 total, 6 thin omitted)

### Community 0 - "xp.js"
Cohesion: 0.17
Nodes (21): addXP(), assertReady(), AVATARS, buyAvatar(), _cache, checkStreak(), getAvatar(), getAvatarData() (+13 more)

### Community 1 - "chat.js"
Cohesion: 0.06
Nodes (44): addMessage(), bannerHangupBtn, callBannerStatus, callBtn, callTimerEl, callWaveBars, chatBox, chatHeroBanner (+36 more)

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
Cohesion: 0.10
Nodes (20): 🔬 Arquitectura y Funcionamiento Técnico, Autenticación Simplificada para Niños, ✨ Características Principales, 🦝 Descripción General, Diagrama de Secuencia del Chat:, 🎨 Diseño y Experiencia de Usuario (UI/UX), 📁 Estructura de Archivos del Proyecto, Estructura de la Base de Datos (Firestore) (+12 more)

### Community 13 - "🚀 Guía de Configuración Paso a Paso"
Cohesion: 0.25
Nodes (8): 🚀 Guía de Configuración Paso a Paso, Opción A — Con Python (Recomendada y sin instalar nada extra):, Opción B — Con Node.js / NPX:, Opción C — Con VS Code:, Paso 1 — Configurar Firebase (Auth + Firestore), Paso 2 — Configurar Reglas de Seguridad (Security Rules), Paso 3 — Configurar Gemini API Key, Paso 4 — Ejecutar el Proyecto en Cualquier Computador

### Community 14 - "admin.js"
Cohesion: 0.27
Nodes (9): ADMIN_EMAILS, allStudents, AVATAR_IMAGES, escapeHtml(), filteredStudents, loadAdminData(), renderStudentsTable(), showToast() (+1 more)

## Knowledge Gaps
- **101 isolated node(s):** `ADMIN_EMAILS`, `allStudents`, `filteredStudents`, `AVATAR_IMAGES`, `passwordInput` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` connect `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` to `🚀 Guía de Configuración Paso a Paso`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `auth` connect `auth.js` to `xp.js`, `quiz.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `🚀 Guía de Configuración Paso a Paso` connect `🚀 Guía de Configuración Paso a Paso` to `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `ADMIN_EMAILS`, `allStudents`, `filteredStudents` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `chat.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05656565656565657 - nodes in this community are weakly interconnected._
- **Should `auth.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._
- **Should `avatars.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._