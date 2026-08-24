import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initXP, addXP } from './xp.js';

// Auth Guard
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'landing.html';
        return;
    }
    await initXP();
    initQuiz();
});

const questionsBank = {
    math: [
        { q: "¿Cuánto es 15 + 27?", options: ["42", "32", "52", "40"], correct: 0 },
        { q: "Si tengo 5 manzanas y me como 2, ¿cuántas quedan?", options: ["2", "3", "5", "0"], correct: 1 },
        { q: "¿Cuánto es 8 x 7?", options: ["54", "64", "56", "48"], correct: 2 },
        { q: "¿Cuál es la mitad de 100?", options: ["25", "40", "10", "50"], correct: 3 },
        { q: "¿Cuánto es 120 - 45?", options: ["65", "70", "85", "75"], correct: 3 },
        { q: "¿Cuánto es 9 x 9?", options: ["81", "90", "72", "99"], correct: 0 }
    ],
    spanish: [
        { q: "¿Cuál de estas palabras es un verbo?", options: ["Correr", "Rápido", "Perro", "Casa"], correct: 0 },
        { q: "¿Cuál es el sinónimo de 'Feliz'?", options: ["Triste", "Contento", "Enojado", "Lento"], correct: 1 },
        { q: "¿Qué signo se usa para preguntar?", options: ["!", "?", ".", ","], correct: 1 },
        { q: "Selecciona el adjetivo en: 'El gato negro'", options: ["El", "Gato", "Negro", "Ninguno"], correct: 2 },
        { q: "¿Cuál es el antónimo de 'Día'?", options: ["Tarde", "Mañana", "Noche", "Sol"], correct: 2 },
        { q: "¿Cuántas sílabas tiene la palabra 'Computadora'?", options: ["3", "4", "5", "6"], correct: 2 }
    ],
    english: [
        { q: "¿Cómo se dice 'Rojo' en inglés?", options: ["Red", "Blue", "Green", "Yellow"], correct: 0 },
        { q: "Traduce 'Cat' al español", options: ["Perro", "Gato", "Pájaro", "Ratón"], correct: 1 },
        { q: "¿Cómo se dice 'Hola' en inglés?", options: ["Goodbye", "Please", "Hello", "Thanks"], correct: 2 },
        { q: "¿Cuál es el verbo 'ser o estar' en inglés?", options: ["To have", "To do", "To be", "To play"], correct: 2 },
        { q: "Traduce 'Apple' al español", options: ["Plátano", "Naranja", "Manzana", "Pera"], correct: 2 },
        { q: "¿Cómo se dice 'Gracias' en inglés?", options: ["Please", "Sorry", "Thanks", "Hello"], correct: 2 }
    ],
    science: [
        { q: "¿Cuál es el planeta más cercano al sol?", options: ["Venus", "Marte", "Mercurio", "Tierra"], correct: 2 },
        { q: "¿Qué gas respiramos para vivir?", options: ["Oxígeno", "Dióxido de carbono", "Nitrógeno", "Helio"], correct: 0 },
        { q: "¿Qué parte de la planta absorbe agua?", options: ["Hoja", "Tallo", "Raíz", "Flor"], correct: 2 },
        { q: "¿Cuál es el animal terrestre más rápido?", options: ["León", "Guepardo", "Tigre", "Caballo"], correct: 1 },
        { q: "¿Cuántos huesos tiene un adulto humano en promedio?", options: ["206", "300", "150", "100"], correct: 0 },
        { q: "¿Cuál es el satélite natural de la Tierra?", options: ["Sol", "Marte", "Luna", "Júpiter"], correct: 2 }
    ],
    social: [
        { q: "¿Cuál es el río más largo del mundo?", options: ["Amazonas", "Nilo", "Misisipi", "Yangtsé"], correct: 0 },
        { q: "¿En qué continente está Egipto?", options: ["Asia", "África", "Europa", "América"], correct: 1 },
        { q: "¿Cuál es la capital de España?", options: ["Barcelona", "Sevilla", "Madrid", "Valencia"], correct: 2 },
        { q: "¿Quién descubrió América?", options: ["Cristóbal Colón", "Hernán Cortés", "Simón Bolívar", "Magallanes"], correct: 0 },
        { q: "¿Qué océano baña la costa oeste de América?", options: ["Atlántico", "Pacífico", "Índico", "Ártico"], correct: 1 },
        { q: "¿Cuál es el país más grande del mundo?", options: ["Canadá", "China", "Estados Unidos", "Rusia"], correct: 3 }
    ]
};

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let canAnswer = true;
let mode = 'math';

function initQuiz() {
    mode = localStorage.getItem('racoon_mode') || 'math';
    const modeNames = {
        math: 'Matemáticas',
        spanish: 'Español',
        english: 'Inglés',
        science: 'Ciencias',
        social: 'Sociales'
    };
    
    document.getElementById('modeLabel').textContent = modeNames[mode] || mode;
    currentQuestions = generateQuiz(mode);
    currentQuestionIndex = 0;
    score = 0;
    
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('resultsScreen').classList.add('hidden');
    
    renderQuestion();
}

function generateQuiz(subject) {
    let qList = questionsBank[subject] || questionsBank['math'];
    // Shuffle and pick 5
    let shuffled = [...qList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
}

function renderQuestion() {
    canAnswer = true;
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('questionCounter').textContent = `Pregunta ${currentQuestionIndex + 1}/5`;
    document.getElementById('progressBar').style.width = `${((currentQuestionIndex) / 5) * 100}%`;
    
    document.getElementById('questionText').textContent = q.q;
    for(let i=0; i<4; i++) {
        document.getElementById(`opt${i}`).textContent = q.options[i];
        const btn = document.getElementById(`opt${i}`).parentElement;
        btn.className = 'option-btn'; // reset classes
    }
    
    // Animation trigger
    const card = document.getElementById('quizScreen');
    card.classList.remove('fadeUp');
    void card.offsetWidth; // trigger reflow
    card.classList.add('fadeUp');
}

window.selectOption = function(selectedIndex) {
    if (!canAnswer) return;
    canAnswer = false;
    
    const q = currentQuestions[currentQuestionIndex];
    const isCorrect = (selectedIndex === q.correct);
    
    const selectedBtn = document.getElementById(`opt${selectedIndex}`).parentElement;
    const correctBtn = document.getElementById(`opt${q.correct}`).parentElement;
    
    if (isCorrect) {
        selectedBtn.classList.add('correct');
        score++;
    } else {
        selectedBtn.classList.add('incorrect');
        correctBtn.classList.add('correct'); // Show correct answer
    }
    
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < 5) {
            renderQuestion();
        } else {
            showResults();
        }
    }, 1500);
};

function showResults() {
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultsScreen').classList.remove('hidden');
    document.getElementById('progressBar').style.width = `100%`;

    const modeNames = {
        math: 'Matemáticas',
        spanish: 'Español',
        english: 'Inglés',
        science: 'Ciencias',
        social: 'Sociales'
    };
    const subjectName = modeNames[mode] || 'esta materia';

    const avatarImg   = document.getElementById('resultsAvatar');
    const badgeEl     = document.getElementById('resultsBadge');
    const titleEl     = document.getElementById('resultsTitle');
    const subtitleEl  = document.getElementById('resultsSubtitle');
    const starsEl     = document.getElementById('starsContainer');
    const scoreEl     = document.getElementById('scoreText');
    const xpEl        = document.getElementById('xpEarnedText');
    const accuracyEl  = document.getElementById('accuracyText');

    let starsHtml = '';
    let xp = score * 100;
    const accuracy = Math.round((score / 5) * 100);

    if (score === 5) {
        starsHtml = '⭐⭐⭐';
        xp += 200; // Bonus por puntaje perfecto (+700 XP total)
        if (titleEl) titleEl.textContent = '¡Puntaje Perfecto! 👑';
        if (subtitleEl) subtitleEl.textContent = `¡Dominas ${subjectName} como todo un maestro!`;
        if (avatarImg) avatarImg.src = 'img/avatars/raccoon_happy.png';
        if (badgeEl) badgeEl.textContent = '🏆';
    } else if (score >= 4) {
        starsHtml = '⭐⭐';
        if (titleEl) titleEl.textContent = '¡Excelente Trabajo! 🎉';
        if (subtitleEl) subtitleEl.textContent = `¡Muy buen desempeño en ${subjectName}!`;
        if (avatarImg) avatarImg.src = 'img/avatars/raccoon_happy.png';
        if (badgeEl) badgeEl.textContent = '🌟';
    } else if (score >= 3) {
        starsHtml = '⭐';
        if (titleEl) titleEl.textContent = '¡Buen Esfuerzo! 👏';
        if (subtitleEl) subtitleEl.textContent = `Vas por buen camino, ¡sigue practicando ${subjectName}!`;
        if (avatarImg) avatarImg.src = 'img/avatars/raccoon_happy.png';
        if (badgeEl) badgeEl.textContent = '👍';
    } else {
        starsHtml = '🩶🩶🩶';
        if (titleEl) titleEl.textContent = '¡No te Rindas! 💪';
        if (subtitleEl) subtitleEl.textContent = `El Profe Mapache te ayudará a repasar ${subjectName}.`;
        if (avatarImg) avatarImg.src = 'img/avatars/raccoon_sad.png';
        if (badgeEl) badgeEl.textContent = '🩹';
    }

    if (starsEl) starsEl.innerHTML = starsHtml;
    if (scoreEl) scoreEl.textContent = `${score} / 5`;
    if (xpEl) xpEl.textContent = `+${xp} XP`;
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;

    // Conceder XP al estudiante
    addXP(xp);
}

window.restartQuiz = function() {
    initQuiz();
};
