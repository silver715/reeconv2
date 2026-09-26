// Mascotas interactivas: animaciones en los bordes de la pantalla

(function () {
  function initPeekingMascots() {
    if (document.getElementById('peekingMascotContainer')) return;

    const container = document.createElement('div');
    container.id = 'peekingMascotContainer';

    const mascotsData = [
      {
        id: 'pm-curious',
        cls: 'peek-left-top',
        img: 'img/raccoon_side_peek.png',
        alt: 'Mapache Curioso',
        quotes: [
          '¡Psst! ¿Sabías que los mapaches usamos nuestras patitas como manitas?',
          '¡Bienvenido a Racoon Teacher! ¡Aprender aquí es motivador e interactivo!',
          '¡Hoy es un gran día para descubrir algo nuevo!'
        ]
      },
      {
        id: 'pm-sunflower',
        cls: 'peek-right-top',
        img: 'img/raccoon_sunflower.png',
        alt: 'Mapache Girasol',
        quotes: [
          '¡Sonríe! Cada pregunta te hace más sabio e inteligente.',
          '¡El esfuerzo constante florece en grandes logros!',
          '¿Sabías que las matemáticas tienen patrones interesantes en la naturaleza?'
        ]
      },
      {
        id: 'pm-cookie',
        cls: 'peek-right-bottom',
        img: 'img/raccoon_eating_cookie.png',
        alt: 'Mapache con Galleta',
        quotes: [
          '¡Te invito una galleta de energía! ¡Tú puedes!',
          '¡Un descanso siempre ayuda a concentrarse mejor!',
          '¡Suma puntos, gana XP y desbloquea nuevos avatares!'
        ]
      },
      {
        id: 'pm-sunglasses',
        cls: 'peek-left-bottom',
        img: 'img/raccoon_sunglasses.png',
        alt: 'Mapache Modo Pro',
        quotes: [
          '¡Modo Pro activado! Aprender con entusiasmo es tu superpoder.',
          '¡No hay materia difícil si tienes la guía correcta!',
          '¡Toca el botón de llamada en el chat para hablar con el Profe en vivo!'
        ]
      }
    ];

    mascotsData.forEach(m => {
      const el = document.createElement('div');
      el.className = `peeking-raccoon ${m.cls}`;
      el.id = m.id;
      el.title = '¡Pasa el cursor o tócame!';

      el.innerHTML = `
        <img src="${m.img}" alt="${m.alt}" class="peek-img" />
        <div class="peek-bubble">
          <p class="peek-text">${m.quotes[0]}</p>
        </div>
      `;

      let quoteIndex = 0;
      const textEl = el.querySelector('.peek-text');

      function playPop() {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(650, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
          }
        } catch (_) {}
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        playPop();
        quoteIndex = (quoteIndex + 1) % m.quotes.length;
        if (textEl) textEl.textContent = m.quotes[quoteIndex];
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 3800);
      });

      container.appendChild(el);
    });

    document.body.appendChild(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPeekingMascots);
  } else {
    initPeekingMascots();
  }
})();
