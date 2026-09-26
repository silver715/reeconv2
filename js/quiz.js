import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initXP, addXP, getAvatarData } from './xp.js';

// Auth Guard
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'landing.html';
        return;
    }
    try {
        await initXP();
    } catch (_) {}
    initQuiz();
});

const questionsBank = {
    math: [
        { q: "¿Cuánto es 15 + 27?", options: ["42", "32", "52", "40"], correct: 0 },
        { q: "Si tengo 5 manzanas y me como 2, ¿cuántas quedan?", options: ["2", "3", "5", "0"], correct: 1 },
        { q: "¿Cuánto es 8 x 7?", options: ["54", "64", "56", "48"], correct: 2 },
        { q: "¿Cuál es la mitad de 100?", options: ["25", "40", "10", "50"], correct: 3 },
        { q: "¿Cuánto es 120 - 45?", options: ["65", "70", "85", "75"], correct: 3 },
        { q: "¿Cuánto es 9 x 9?", options: ["81", "90", "72", "99"], correct: 0 },
        { q: "¿Cuánto es 6 x 8?", options: ["42", "48", "54", "46"], correct: 1 },
        { q: "¿Cuál es el triple de 15?", options: ["30", "45", "50", "35"], correct: 1 },
        { q: "Si compras 3 cuadernos a $4 cada uno, ¿cuánto pagas en total?", options: ["$7", "$10", "$12", "$14"], correct: 2 },
        { q: "¿Cuánto es 250 + 350?", options: ["500", "600", "550", "650"], correct: 1 },
        { q: "¿Cuántos minutos hay en 2 horas y media?", options: ["120 minutos", "130 minutos", "150 minutos", "180 minutos"], correct: 2 },
        { q: "¿Cuánto es 64 dividido entre 8?", options: ["6", "7", "8", "9"], correct: 2 },
        { q: "¿Cuál es el número romano que representa al 50?", options: ["X", "L", "C", "D"], correct: 1 },
        { q: "¿Cuántos lados tiene un hexágono?", options: ["5", "6", "7", "8"], correct: 1 },
        { q: "¿Cuál es el resultado de 100 - 37?", options: ["63", "73", "53", "67"], correct: 0 },
        { q: "¿Cuánto es 12 x 5?", options: ["50", "55", "60", "65"], correct: 2 },
        { q: "¿Qué número sigue en la serie: 2, 4, 8, 16, ...?", options: ["24", "30", "32", "36"], correct: 2 },
        { q: "¿Cuánto es 500 - 180?", options: ["320", "340", "310", "420"], correct: 0 },
        { q: "¿Cuál es el perímetro de un cuadrado cuyos lados miden 5 cm?", options: ["10 cm", "15 cm", "20 cm", "25 cm"], correct: 2 },
        { q: "Si repartes 24 dulces en partes iguales entre 4 niños, ¿cuántos recibe cada uno?", options: ["4", "5", "6", "8"], correct: 2 },
        { q: "¿Cuánto es 7 x 7?", options: ["42", "47", "49", "56"], correct: 2 },
        { q: "¿Cuánto es la cuarta parte de 80?", options: ["15", "20", "25", "40"], correct: 1 },
        { q: "¿Qué número es impar?", options: ["14", "22", "37", "48"], correct: 2 },
        { q: "¿Cuánto es 90 + 110?", options: ["190", "200", "210", "220"], correct: 1 },
        { q: "¿Cuántos centímetros hay en 3 metros?", options: ["30 cm", "300 cm", "3000 cm", "3 cm"], correct: 1 },
        { q: "¿Cuánto es 45 dividido entre 5?", options: ["7", "8", "9", "10"], correct: 2 }
    ],
    spanish: [
        { q: "¿Cuál de estas palabras es un verbo?", options: ["Correr", "Rápido", "Perro", "Casa"], correct: 0 },
        { q: "¿Cuál es el sinónimo de 'Feliz'?", options: ["Triste", "Contento", "Enojado", "Lento"], correct: 1 },
        { q: "¿Qué signo se usa para preguntar?", options: ["!", "?", ".", ","], correct: 1 },
        { q: "Selecciona el adjetivo en: 'El gato negro'", options: ["El", "Gato", "Negro", "Ninguno"], correct: 2 },
        { q: "¿Cuál es el antónimo de 'Día'?", options: ["Tarde", "Mañana", "Noche", "Sol"], correct: 2 },
        { q: "¿Cuántas sílabas tiene la palabra 'Computadora'?", options: ["3", "4", "5", "6"], correct: 2 },
        { q: "¿Cuál es el antónimo de 'Valiente'?", options: ["Fuerte", "Cobarde", "Héroe", "Rápido"], correct: 1 },
        { q: "¿Cuál de estas palabras es esdrújula?", options: ["Canción", "Música", "Papel", "Café"], correct: 1 },
        { q: "¿Cuál es el sustantivo en la frase: 'El perro ladra fuerte'?", options: ["El", "Perro", "Ladra", "Fuerte"], correct: 1 },
        { q: "¿Cómo se llaman las palabras que tienen significados parecidos o iguales?", options: ["Antónimos", "Sinónimos", "Homófonas", "Adverbios"], correct: 1 },
        { q: "¿Cuál es el plural de la palabra 'Pez'?", options: ["Pezes", "Peces", "Pezs", "Peceses"], correct: 1 },
        { q: "¿Cuál de estas palabras es una palabra aguda?", options: ["Cántaro", "Árbol", "Canción", "Lápiz"], correct: 2 },
        { q: "¿Cuál es el sinónimo de 'Comenzar'?", options: ["Terminar", "Iniciar", "Pausar", "Cerrar"], correct: 1 },
        { q: "¿Qué tipo de palabra expresa una acción o estado?", options: ["Sustantivo", "Adjetivo", "Verbo", "Artículo"], correct: 2 },
        { q: "En la oración 'Ellos corrieron ayer', ¿en qué tiempo está el verbo?", options: ["Presente", "Pasado", "Futuro", "Condicional"], correct: 1 },
        { q: "¿Cuál es el femenino de 'Actor'?", options: ["Actriz", "Actora", "Actrizona", "Actrina"], correct: 0 },
        { q: "¿Qué signo de puntuación se usa para hacer una pausa corta en la lectura?", options: ["Punto", "Coma", "Dos puntos", "Guion"], correct: 1 },
        { q: "¿Cuál de estas palabras es un adjetivo calificativo?", options: ["Saltar", "Hermoso", "Bosque", "Ayer"], correct: 1 },
        { q: "¿Cuántas sílabas tiene la palabra 'Mariposa'?", options: ["3", "4", "5", "2"], correct: 1 },
        { q: "¿Cuál es el sujeto en: 'Mi hermano juega fútbol todos los sábados'?", options: ["Mi hermano", "Juega fútbol", "Todos los sábados", "Fútbol"], correct: 0 },
        { q: "¿Qué letra es muda en español si no va precedida por una 'c'?", options: ["G", "H", "J", "K"], correct: 1 },
        { q: "¿Cuál de estas palabras rima con 'Cantar'?", options: ["Correr", "Soñar", "Vivir", "Dormir"], correct: 1 },
        { q: "¿Cómo se llama la persona que escribe un libro?", options: ["Pintor", "Autor", "Escultor", "Lector"], correct: 1 },
        { q: "¿Cuál es el antónimo de 'Oscuro'?", options: ["Negro", "Triste", "Claro", "Sombra"], correct: 2 },
        { q: "¿Cuál es un artículo determinado femenino y plural?", options: ["Los", "Las", "Una", "Unos"], correct: 1 },
        { q: "¿Cuál de estas opciones es una oración completa con sujeto y predicado?", options: ["El sol brillante", "Por la mañana temprano", "El niño lee un cuento", "Muy rápido"], correct: 2 }
    ],
    english: [
        { q: "¿Cómo se dice 'Rojo' en inglés?", options: ["Red", "Blue", "Green", "Yellow"], correct: 0 },
        { q: "Traduce 'Cat' al español", options: ["Perro", "Gato", "Pájaro", "Ratón"], correct: 1 },
        { q: "¿Cómo se dice 'Hola' en inglés?", options: ["Goodbye", "Please", "Hello", "Thanks"], correct: 2 },
        { q: "¿Cuál es el verbo 'ser o estar' en inglés?", options: ["To have", "To do", "To be", "To play"], correct: 2 },
        { q: "Traduce 'Apple' al español", options: ["Plátano", "Naranja", "Manzana", "Pera"], correct: 2 },
        { q: "¿Cómo se dice 'Gracias' en inglés?", options: ["Please", "Sorry", "Thanks", "Hello"], correct: 2 },
        { q: "¿Cómo se dice 'Azul' en inglés?", options: ["Blue", "Black", "Brown", "Green"], correct: 0 },
        { q: "Traduce 'Dog' al español", options: ["Gato", "Perro", "Conejo", "Caballo"], correct: 1 },
        { q: "¿Cómo se dice 'Libro' en inglés?", options: ["Table", "Pen", "Book", "Chair"], correct: 2 },
        { q: "¿Cuál es el opuesto de 'Big'?", options: ["Small", "Tall", "Fast", "Hot"], correct: 0 },
        { q: "¿Cómo se escribe el número 10 en inglés?", options: ["Two", "Seven", "Ten", "Twelve"], correct: 2 },
        { q: "Traduce 'Good morning' al español", options: ["Buenas noches", "Buenos días", "Buenas tardes", "Hasta luego"], correct: 1 },
        { q: "¿Qué animal es 'Elephant'?", options: ["Jirafa", "León", "Elefante", "Mono"], correct: 2 },
        { q: "¿Cómo se dice 'Agua' en inglés?", options: ["Milk", "Water", "Juice", "Bread"], correct: 1 },
        { q: "¿Cuál es el pronombre en inglés para 'Ella'?", options: ["He", "She", "It", "They"], correct: 1 },
        { q: "Traduce 'House' al español", options: ["Casa", "Escuela", "Parque", "Tienda"], correct: 0 },
        { q: "¿Cómo se dice 'Por favor' en inglés?", options: ["Thank you", "Sorry", "Please", "Welcome"], correct: 2 },
        { q: "¿Cuál es el color 'Yellow'?", options: ["Verde", "Amarillo", "Blanco", "Naranja"], correct: 1 },
        { q: "¿Qué día de la semana es 'Monday'?", options: ["Domingo", "Lunes", "Martes", "Miércoles"], correct: 1 },
        { q: "¿Cómo se dice 'Hermano' en inglés?", options: ["Sister", "Father", "Brother", "Mother"], correct: 2 },
        { q: "Completa la frase: 'I ___ a student.'", options: ["is", "am", "are", "be"], correct: 1 },
        { q: "¿Qué parte del cuerpo es 'Hand'?", options: ["Pie", "Mano", "Cabeza", "Ojo"], correct: 1 },
        { q: "¿Cómo se dice 'Escuela' en inglés?", options: ["School", "Teacher", "Pencil", "Desk"], correct: 0 },
        { q: "¿Qué fruta es 'Banana'?", options: ["Manzana", "Plátano", "Fresa", "Uva"], correct: 1 },
        { q: "¿Cuál es el plural regular de 'Boy'?", options: ["Boyes", "Boys", "Boies", "Children"], correct: 1 },
        { q: "¿Cómo se dice 'Adiós' en inglés?", options: ["Hello", "Goodbye", "Welcome", "Nice"], correct: 1 }
    ],
    science: [
        { q: "¿Cuál es el planeta más cercano al sol?", options: ["Venus", "Marte", "Mercurio", "Tierra"], correct: 2 },
        { q: "¿Qué gas respiramos para vivir?", options: ["Oxígeno", "Dióxido de carbono", "Nitrógeno", "Helio"], correct: 0 },
        { q: "¿Qué parte de la planta absorbe agua?", options: ["Hoja", "Tallo", "Raíz", "Flor"], correct: 2 },
        { q: "¿Cuál es el animal terrestre más rápido?", options: ["León", "Guepardo", "Tigre", "Caballo"], correct: 1 },
        { q: "¿Cuántos huesos tiene un adulto humano en promedio?", options: ["206", "300", "150", "100"], correct: 0 },
        { q: "¿Cuál es el satélite natural de la Tierra?", options: ["Sol", "Marte", "Luna", "Júpiter"], correct: 2 },
        { q: "¿Cuál es el órgano principal del sistema circulatorio?", options: ["Pulmón", "Corazón", "Cerebro", "Estómago"], correct: 1 },
        { q: "¿En qué estado se encuentra el agua en forma de hielo?", options: ["Líquido", "Gaseoso", "Sólido", "Plasma"], correct: 2 },
        { q: "¿Cuál es el proceso por el cual las plantas fabrican su propio alimento?", options: ["Respiración", "Fotosíntesis", "Polinización", "Digestión"], correct: 1 },
        { q: "¿Qué animal es un mamífero acuático?", options: ["Tiburón", "Delfín", "Atún", "Pulpo"], correct: 1 },
        { q: "¿Cuál es la estrella más cercana a la Tierra?", options: ["Alfa Centauri", "Sirio", "El Sol", "Polar"], correct: 2 },
        { q: "¿Cuál es el planeta más grande del Sistema Solar?", options: ["Saturno", "Neptuno", "Júpiter", "Urano"], correct: 2 },
        { q: "¿Qué sentido nos permite percibir los olores?", options: ["La vista", "El olfato", "El gusto", "El tacto"], correct: 1 },
        { q: "¿Cómo se llaman los animales que se alimentan exclusivamente de plantas?", options: ["Carnívoros", "Herbívoros", "Omnívoros", "Insectívoros"], correct: 1 },
        { q: "¿Cuál de los siguientes no es un estado común de la materia?", options: ["Sólido", "Líquido", "Gaseoso", "Gravedad"], correct: 3 },
        { q: "¿Qué fuerza hace que los objetos caigan al suelo?", options: ["Fricción", "Gravedad", "Magnetismo", "Inercia"], correct: 1 },
        { q: "¿Cuál es el órgano encargado de procesar la información y controlar el cuerpo?", options: ["Hígado", "Corazón", "Cerebro", "Riñón"], correct: 2 },
        { q: "¿Qué tipo de animal nace de un huevo?", options: ["Vivíparo", "Ovíparo", "Mamífero", "Marsupial"], correct: 1 },
        { q: "¿Cuántas patas tiene un insecto típicamente?", options: ["4", "6", "8", "10"], correct: 1 },
        { q: "¿Qué nombre recibe el ciclo por el que el agua se evapora, condensa y precipita?", options: ["Ciclo solar", "Ciclo del agua", "Ciclo del carbono", "Ciclo lunar"], correct: 1 },
        { q: "¿Cuál es el órgano más grande del cuerpo humano?", options: ["La piel", "El hígado", "El corazón", "El cerebro"], correct: 0 },
        { q: "¿Qué instrumento se usa para observar objetos microscópicos?", options: ["Telescopio", "Microscopio", "Termómetro", "Barómetro"], correct: 1 },
        { q: "¿Qué gas liberan las plantas durante la fotosíntesis?", options: ["Oxígeno", "Dióxido de carbono", "Metano", "Nitrógeno"], correct: 0 },
        { q: "¿A qué temperatura hierve el agua a nivel del mar?", options: ["50 °C", "75 °C", "100 °C", "200 °C"], correct: 2 },
        { q: "¿Qué mineral es fundamental para tener huesos y dientes fuertes?", options: ["Hierro", "Calcio", "Potasio", "Yodo"], correct: 1 },
        { q: "¿Cuál de estos animales es un anfibio?", options: ["Cocodrilo", "Rana", "Serpiente", "Tortuga"], correct: 1 }
    ],
    social: [
        { q: "¿Cuál es el río más largo del mundo?", options: ["Amazonas", "Nilo", "Misisipi", "Yangtsé"], correct: 0 },
        { q: "¿En qué continente está Egipto?", options: ["Asia", "África", "Europa", "América"], correct: 1 },
        { q: "¿Cuál es la capital de España?", options: ["Barcelona", "Sevilla", "Madrid", "Valencia"], correct: 2 },
        { q: "¿Quién descubrió América?", options: ["Cristóbal Colón", "Hernán Cortés", "Simón Bolívar", "Magallanes"], correct: 0 },
        { q: "¿Qué océano baña la costa oeste de América?", options: ["Atlántico", "Pacífico", "Índico", "Ártico"], correct: 1 },
        { q: "¿Cuál es el país más grande del mundo?", options: ["Canadá", "China", "Estados Unidos", "Rusia"], correct: 3 },
        { q: "¿En qué continente se encuentra la cordillera del Himalaya?", options: ["Asia", "Europa", "África", "Oceanía"], correct: 0 },
        { q: "¿Cuál es la capital de Francia?", options: ["Londres", "Berlín", "París", "Roma"], correct: 2 },
        { q: "¿Qué cordillera atraviesa gran parte de América del Sur?", options: ["Los Alpes", "Los Andes", "Los Pirineos", "Las Rocosas"], correct: 1 },
        { q: "¿Cuál es el idioma más hablado en la mayoría de los países de América Latina?", options: ["Portugués", "Español", "Inglés", "Francés"], correct: 1 },
        { q: "¿Cuántos continentes se consideran tradicionalmente en el modelo de 6 continentes?", options: ["4", "5", "6", "8"], correct: 2 },
        { q: "¿En qué país se encuentran las famosas pirámides de Chichén Itzá?", options: ["Perú", "México", "Colombia", "Guatemala"], correct: 1 },
        { q: "¿Cuál es la capital de Colombia?", options: ["Medellín", "Cali", "Bogotá", "Cartagena"], correct: 2 },
        { q: "¿Qué océano es el más extenso del planeta?", options: ["Atlántico", "Pacífico", "Índico", "Ártico"], correct: 1 },
        { q: "¿Cuál es el desierto cálido más grande del mundo?", options: ["Atacama", "Gobi", "Sahara", "Kalahari"], correct: 2 },
        { q: "¿En qué antigua civilización se inventó el papel y la brújula?", options: ["Japón", "China", "India", "Egipto"], correct: 1 },
        { q: "¿Cuál es la capital de Italia?", options: ["Venecia", "Milán", "Florencia", "Roma"], correct: 3 },
        { q: "¿En qué ciudad se encuentra la famosa Estatua de la Libertad?", options: ["Washington D.C.", "Nueva York", "Los Ángeles", "Chicago"], correct: 1 },
        { q: "¿Cuál es la línea imaginaria que divide a la Tierra en hemisferio Norte y hemisferio Sur?", options: ["Meridiano de Greenwich", "Trópico de Cáncer", "Ecuador", "Trópico de Capricornio"], correct: 2 },
        { q: "¿Cuál de estos países tiene forma similar a una bota en el mapa?", options: ["España", "Grecia", "Italia", "Portugal"], correct: 2 },
        { q: "¿En qué país se encuentra la histórica ciudad inca de Machu Picchu?", options: ["Perú", "Bolivia", "Ecuador", "Chile"], correct: 0 },
        { q: "¿Qué tres colores componen la bandera de Colombia?", options: ["Amarillo, azul y rojo", "Blanco, azul y rojo", "Verde, blanco y rojo", "Azul, blanco y verde"], correct: 0 },
        { q: "¿Cuál es la moneda oficial de la mayoría de los países de la Unión Europea?", options: ["Dólar", "Libra", "Euro", "Franco"], correct: 2 },
        { q: "¿Qué antigua civilización construyó el Coliseo?", options: ["Griega", "Romana", "Egipcia", "Maya"], correct: 1 },
        { q: "¿Cuál es el continente más frío y con mayor cantidad de hielo en el planeta?", options: ["Europa", "Asia", "Antártida", "América del Norte"], correct: 2 },
        { q: "¿Cuál es la capital de Argentina?", options: ["Córdoba", "Buenos Aires", "Rosario", "Mendoza"], correct: 1 }
    ]
};

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let canAnswer = true;
let mode = 'math';
let streak = 0;
let liveScore = 0;
let liveXp = 0;
let userSkinData = { name: 'Mapache Feliz', img: 'img/avatars/raccoon_happy.png' };

const idlePhrases = [
    "¡Tú puedes! Lee con calma y elige la mejor respuesta.",
    "¡A por los 5 aciertos! ¡Confío en tus conocimientos!",
    "¡Concéntrate! Cada pregunta suma experiencia para tu nivel.",
    "¡Demuestra lo que has aprendido hoy!",
    "¡Tómate tu tiempo, analiza cada una de las opciones!"
];

const correctPhrases = [
    "¡Exacto! ¡Esa era la respuesta correcta! (+100 XP)",
    "¡Excelente! ¡Qué rapidez y precisión tienes!",
    "¡Brillante! ¡Sigue manteniendo esa racha!",
    "¡Imparable! ¡Dominas este tema a la perfección!",
    "¡Respuesta impecable! ¡Vamos con la siguiente!"
];

const incorrectPhrases = [
    "¡Casi lo logras! De los errores también se aprende.",
    "¡No te preocupes! ¡La siguiente la sacamos bien!",
    "¡Buen intento! Respira profundo y vamos por la próxima.",
    "¡Ánimo! El esfuerzo constante es lo que hace a los campeones.",
    "¡Tranquilo! Sigamos adelante, ¡aún queda quiz por resolver!"
];

function setBubblePhrase(text, type = 'idle') {
    const bubble = document.getElementById('companionBubble');
    const bubbleText = document.getElementById('companionBubbleText');
    if (!bubble || !bubbleText) return;

    bubble.classList.remove('bubble-correct', 'bubble-incorrect');
    if (type === 'correct') bubble.classList.add('bubble-correct');
    if (type === 'incorrect') bubble.classList.add('bubble-incorrect');

    bubbleText.textContent = text;
}

function initQuiz() {
    mode = localStorage.getItem('racoon_mode') || 'math';
    const grade = localStorage.getItem('racoon_grade') || 'Cuarto';
    const modeNames = {
        math: 'Matemáticas',
        spanish: 'Español',
        english: 'Inglés',
        science: 'Ciencias Naturales',
        social: 'Ciencias Sociales'
    };
    
    const modeLabel = document.getElementById('modeLabel');
    if (modeLabel) modeLabel.textContent = modeNames[mode] || mode;

    const gradeBadge = document.getElementById('gradeBadge');
    if (gradeBadge) gradeBadge.textContent = `${grade} Grado`;

    // Cargar Skin activa del estudiante
    try {
        userSkinData = (typeof getAvatarData === 'function') ? getAvatarData() : { name: 'Mapache Feliz', img: 'img/avatars/raccoon_happy.png' };
    } catch (_) {
        userSkinData = { name: 'Mapache Feliz', img: 'img/avatars/raccoon_happy.png' };
    }

    const companionSkinImg  = document.getElementById('companionSkinImg');
    const companionSkinName = document.getElementById('companionSkinName');
    if (companionSkinImg)  companionSkinImg.src = userSkinData.img;
    if (companionSkinName) companionSkinName.textContent = userSkinData.name;

    currentQuestions = generateQuiz(mode);
    currentQuestionIndex = 0;
    score = 0;
    streak = 0;
    liveScore = 0;
    liveXp = 0;

    updateHud();

    const quizScreen = document.getElementById('quizScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    if (quizScreen) quizScreen.classList.remove('hidden');
    if (resultsScreen) resultsScreen.classList.add('hidden');
    
    renderQuestion();
}

function updateHud() {
    const liveScoreEl = document.getElementById('liveScore');
    const liveXpEl    = document.getElementById('liveXp');
    const streakEl    = document.getElementById('streakCount');
    const streakPill  = document.getElementById('streakPill');

    if (liveScoreEl) liveScoreEl.textContent = `${liveScore}`;
    if (liveXpEl)    liveXpEl.textContent = `+${liveXp} XP`;
    if (streakEl)    streakEl.textContent = `${streak} Racha`;

    if (streakPill) {
        if (streak >= 2) {
            streakPill.classList.add('on-fire');
        } else {
            streakPill.classList.remove('on-fire');
        }
    }
}

function generateQuiz(subject) {
    let qList = questionsBank[subject] || questionsBank['math'];
    let shuffled = [...qList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
}

function renderQuestion() {
    canAnswer = true;
    const q = currentQuestions[currentQuestionIndex];
    
    const counterEl = document.getElementById('questionCounter');
    if (counterEl) counterEl.textContent = `${currentQuestionIndex + 1} / 5`;

    const trackerEl = document.getElementById('cardQuestionTracker');
    if (trackerEl) trackerEl.textContent = `Pregunta ${currentQuestionIndex + 1} de 5`;

    const progressEl = document.getElementById('progressBar');
    if (progressEl) progressEl.style.width = `${((currentQuestionIndex) / 5) * 100}%`;
    
    const questionTextEl = document.getElementById('questionText');
    if (questionTextEl) questionTextEl.textContent = q.q;

    for (let i = 0; i < 4; i++) {
        const optText = document.getElementById(`opt${i}`);
        if (optText) {
            optText.textContent = q.options[i];
            const btn = optText.closest('.option-btn');
            if (btn) btn.className = 'option-btn';
        }
    }
    
    // Quitar animaciones previas del pedestal de la skin
    const pedestal = document.getElementById('skinPedestal');
    if (pedestal) {
        pedestal.classList.remove('celebrating', 'encouraging');
    }

    // Frase amigable inicial para la pregunta
    const randomIdle = idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
    setBubblePhrase(randomIdle, 'idle');
    
    // Efecto de entrada en la tarjeta de preguntas
    const card = document.querySelector('.quiz-card');
    if (card) {
        card.classList.remove('fadeUp');
        void card.offsetWidth;
        card.classList.add('fadeUp');
    }
}

window.selectOption = function(selectedIndex) {
    if (!canAnswer) return;
    canAnswer = false;
    
    const q = currentQuestions[currentQuestionIndex];
    const isCorrect = (selectedIndex === q.correct);
    
    const optSpan = document.getElementById(`opt${selectedIndex}`);
    const selectedBtn = optSpan ? optSpan.closest('.option-btn') : null;
    const correctSpan = document.getElementById(`opt${q.correct}`);
    const correctBtn = correctSpan ? correctSpan.closest('.option-btn') : null;

    const pedestal = document.getElementById('skinPedestal');

    if (isCorrect) {
        if (selectedBtn) selectedBtn.classList.add('correct');
        score++;
        streak++;
        liveScore++;
        liveXp += 100;

        // Reacción alegre de la Skin del Estudiante
        if (pedestal) {
            pedestal.classList.remove('encouraging');
            pedestal.classList.add('celebrating');
        }
        const phrase = correctPhrases[Math.floor(Math.random() * correctPhrases.length)];
        setBubblePhrase(phrase, 'correct');

        spawnXpParticle('+100 XP');
    } else {
        if (selectedBtn) selectedBtn.classList.add('incorrect');
        if (correctBtn) correctBtn.classList.add('correct');
        streak = 0;

        // Reacción de aliento de la Skin del Estudiante
        if (pedestal) {
            pedestal.classList.remove('celebrating');
            pedestal.classList.add('encouraging');
        }
        const phrase = incorrectPhrases[Math.floor(Math.random() * incorrectPhrases.length)];
        setBubblePhrase(phrase, 'incorrect');
    }

    updateHud();
    
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < 5) {
            renderQuestion();
        } else {
            showResults();
        }
    }, 1600);
};

function spawnXpParticle(text) {
    const stage = document.querySelector('.companion-avatar-card');
    if (!stage) return;
    const toast = document.createElement('div');
    toast.className = 'quiz-xp-particle';
    toast.textContent = text;
    stage.appendChild(toast);
    setTimeout(() => toast.remove(), 1200);
}

function renderSvgStars(count) {
    let html = '';
    for (let i = 1; i <= 3; i++) {
        const isGold = i <= count;
        const fill = isGold ? '#f5c842' : 'rgba(255, 255, 255, 0.15)';
        const glow = isGold ? 'filter: drop-shadow(0 0 10px rgba(245, 200, 66, 0.65));' : '';
        html += `
          <svg viewBox="0 0 24 24" width="38" height="38" fill="${fill}" style="${glow}; margin: 0 4px; transition: transform 0.3s ease;">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        `;
    }
    return html;
}

function showResults() {
    const quizScreen = document.getElementById('quizScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    if (quizScreen) quizScreen.classList.add('hidden');
    if (resultsScreen) resultsScreen.classList.remove('hidden');

    const progressEl = document.getElementById('progressBar');
    if (progressEl) progressEl.style.width = `100%`;

    const modeNames = {
        math: 'Matemáticas',
        spanish: 'Español',
        english: 'Inglés',
        science: 'Ciencias Naturales',
        social: 'Ciencias Sociales'
    };
    const subjectName = modeNames[mode] || 'esta materia';

    const avatarImg   = document.getElementById('resultsAvatar');
    const skinLabelEl = document.getElementById('resultsSkinLabel');
    const titleEl     = document.getElementById('resultsTitle');
    const subtitleEl  = document.getElementById('resultsSubtitle');
    const starsEl     = document.getElementById('starsContainer');
    const scoreEl     = document.getElementById('scoreText');
    const xpEl        = document.getElementById('xpEarnedText');
    const accuracyEl  = document.getElementById('accuracyText');

    let starCount = 0;
    let xp = score * 100;
    const accuracy = Math.round((score / 5) * 100);

    // Mostrar siempre la skin equipada del estudiante en el podio
    if (avatarImg)   avatarImg.src = userSkinData.img;
    if (skinLabelEl) skinLabelEl.textContent = `Tu Skin: ${userSkinData.name}`;

    if (score === 5) {
        starCount = 3;
        xp += 200; // Bonus por puntaje perfecto (+700 XP total)
        if (titleEl)    titleEl.textContent = '¡Puntaje Perfecto!';
        if (subtitleEl) subtitleEl.textContent = `¡Dominas ${subjectName} como todo un maestro!`;
    } else if (score >= 4) {
        starCount = 2;
        if (titleEl)    titleEl.textContent = '¡Excelente Desempeño!';
        if (subtitleEl) subtitleEl.textContent = `¡Muy buen dominio de ${subjectName}!`;
    } else if (score >= 3) {
        starCount = 1;
        if (titleEl)    titleEl.textContent = '¡Buen Esfuerzo!';
        if (subtitleEl) subtitleEl.textContent = `Vas por buen camino, ¡sigue practicando ${subjectName}!`;
    } else {
        starCount = 0;
        if (titleEl)    titleEl.textContent = '¡Sigue Practicando!';
        if (subtitleEl) subtitleEl.textContent = `Repasa con el Profe Mapache y vuelve a intentarlo.`;
    }

    if (starsEl) starsEl.innerHTML = renderSvgStars(starCount);
    if (scoreEl) scoreEl.textContent = `${score} / 5`;
    if (xpEl) xpEl.textContent = `+${xp} XP`;
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;

    // Conceder XP al estudiante
    try {
        addXP(xp);
    } catch (_) {}
}

window.restartQuiz = function() {
    initQuiz();
};
