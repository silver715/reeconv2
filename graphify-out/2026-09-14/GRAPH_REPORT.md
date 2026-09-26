# Graph Report - reeconv2  (2026-09-11)

## Corpus Check
- 20 files · ~78,995 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 205 nodes · 243 edges · 20 communities (14 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
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
- 🔬 Arquitectura y Funcionamiento Técnico
- admin.js
- rules/graphify.md
- workflows/graphify.md
- chat.original.js
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

## Communities (20 total, 6 thin omitted)

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
Cohesion: 0.09
Nodes (21): ✨ Características Principales, 🦝 Descripción General, 🎨 Diseño y Experiencia de Usuario (UI/UX), 📁 Estructura de Archivos del Proyecto, 🚀 Guía de Configuración Paso a Paso, 🏆 Leaderboard / Ranking Global, 📄 Licencia y Créditos, 📚 Materias y Quizzes Disponibles (+13 more)

### Community 13 - "🔬 Arquitectura y Funcionamiento Técnico"
Cohesion: 0.29
Nodes (7): 🔬 Arquitectura y Funcionamiento Técnico, Autenticación Simplificada para Niños, Diagrama de Secuencia del Chat:, Estructura de la Base de Datos (Firestore), Formateador de Markdown e Interfaz Educativa, Integración con Gemini API y Fallback Local, Motor de XP e Inmutabilidad de UI (`persistAsync`)

### Community 14 - "admin.js"
Cohesion: 0.27
Nodes (9): ADMIN_EMAILS, allStudents, AVATAR_IMAGES, escapeHtml(), filteredStudents, loadAdminData(), renderStudentsTable(), showToast() (+1 more)

### Community 18 - "chat.original.js"
Cohesion: 0.15
Nodes (16): addMessage(), chatBox, conversationHistory, formatMarkdown(), getLocalResponse(), input, modeLabel, modeNames (+8 more)

## Knowledge Gaps
- **112 isolated node(s):** `ADMIN_EMAILS`, `allStudents`, `filteredStudents`, `AVATAR_IMAGES`, `passwordInput` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` connect `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` to `🔬 Arquitectura y Funcionamiento Técnico`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `auth` connect `auth.js` to `xp.js`, `quiz.js`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `ADMIN_EMAILS`, `allStudents`, `filteredStudents` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `chat.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05656565656565657 - nodes in this community are weakly interconnected._
- **Should `auth.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._
- **Should `avatars.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `🦝 Racoon Teacher v2.0 — Plataforma Educativa Gamificada` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._