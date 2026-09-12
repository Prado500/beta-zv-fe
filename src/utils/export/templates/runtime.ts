import { BLOOM_TOTAL_MS } from '../../bloomArt';
import { PHRASE_TOTAL_MS } from '../../phraseLayout';
import { MEM_LEAVE_AT_MS, MEM_LEAVE_MS, MEM_SETTLE_AT_MS } from '../../memoriesLayout';

/**
 * Script del documento exportado.
 *
 * Todo el estado vive en un único atributo `data-state` del escenario y el CSS
 * reacciona a él. Antes se añadían y quitaban clases de Tailwind a mano en cada
 * elemento, lo que dejaba de funcionar en cuanto una de esas clases no existía
 * en la versión del CDN.
 *
 * La cadena de momentos es la misma que la de la app:
 *
 *   sobre → floración → frase → recuerdos → estallido → carta
 *
 * Con saltos donde no hay material: sin mensaje no hay frase, y sin fotos no
 * hay recuerdos ni estallido —se pasa derecho a la carta—, igual que en la
 * previa.
 */
export const buildRuntime = (photos: string[], hasPhrase: boolean): string => `
(function () {
  var PHOTOS = ${JSON.stringify(photos)};
  var HAS_PHRASE = ${hasPhrase ? 'true' : 'false'};
  var BLOOM_MS = ${BLOOM_TOTAL_MS};
  var PHRASE_MS = ${PHRASE_TOTAL_MS};
  var BURST_MS = 2600;
  var MEM_SETTLE_AT_MS = ${MEM_SETTLE_AT_MS};
  var MEM_LEAVE_AT_MS = ${MEM_LEAVE_AT_MS};
  var MEM_DONE_MS = ${MEM_LEAVE_AT_MS + MEM_LEAVE_MS};

  var stage = document.getElementById('stage');
  var screen = document.getElementById('screen');
  var envelope = document.getElementById('envelope');
  var bloomScene = document.getElementById('bloom-scene');
  var closeCard = document.getElementById('close-card');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var counter = document.getElementById('lightbox-counter');

  var sceneTimers = [];
  var current = null;

  /* ---- Música ----
   *
   * El mismo reproductor de la app, pero escrito a mano: sin librerías y sin
   * cargar el script de YouTube. Todo el control va por postMessage al propio
   * marco, que es la API oficial del embebido.
   *
   * El marco se carga en pausa al abrir el documento, y el toque sobre el
   * sobre sólo le da play. Con el reproductor ya listo la orden sale en el
   * mismo instante del gesto y entra en la ventana de permiso del navegador;
   * si el marco se creara en el toque, en el celular tardaría uno o tres
   * segundos y para entonces el permiso habría caducado.
   */
  var MUSIC_FADE_MS = 2500;
  var MUSIC_STEP_MS = 60;
  var MUSIC_FULL = 100;
  var LISTEN_STEP_MS = 250;
  /* Estos errores significan "esta canción no va a sonar aquí": 101 y 150 = el
     dueño no permite embeberla; 100 = no existe o es privada; 2 = id inválido;
     153 = YouTube no reconoce de dónde viene la página. Muy común en videos
     oficiales de discográficas. */
  var BLOCKING_ERRORS = [2, 100, 101, 150, 153];

  var music = document.getElementById('music');
  var musicFrame = document.getElementById('music-frame');
  var musicHint = document.getElementById('player-hint');
  var musicToggle = document.getElementById('player-toggle');

  var musicReady = false;
  var musicPending = false;
  var musicPlaying = false;
  var musicBlocked = false;
  var musicVolume = 0;
  var fadeTimer = null;
  var listenTimer = null;

  /* Se acabó la música: se enseña el panel que lleva a YouTube y no se vuelve
     a pedir nada. Sin esto, un "listo" que llegara después del error volvía a
     dar play y el panel se quedaba diciendo "Reproduciendo…" en silencio. */
  function musicBlock() {
    if (musicBlocked) return;
    musicBlocked = true;
    musicPending = false;
    stopFade();
    if (music) music.classList.add('is-blocked');
    setPlaying(false);
  }

  function musicPost(func, args) {
    if (!musicFrame || !musicFrame.contentWindow) return;
    musicFrame.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: func, args: args || [] }),
      '*'
    );
  }

  function stopFade() {
    if (fadeTimer) clearInterval(fadeTimer);
    fadeTimer = null;
  }

  /* Única forma de tocar el volumen: entrada y apagado comparten esta rampa,
     así no pueden pelearse. Arrancar una cancela la anterior. */
  function musicRamp(to, ms) {
    stopFade();
    var from = musicVolume;
    var startedAt = Date.now();
    fadeTimer = setInterval(function () {
      var t = Math.min(1, (Date.now() - startedAt) / ms);
      var value = Math.round(from + (to - from) * (t * t * (3 - 2 * t)));
      musicVolume = value;
      musicPost('setVolume', [value]);
      if (t >= 1) stopFade();
    }, MUSIC_STEP_MS);
  }

  function setPlaying(next) {
    musicPlaying = next;
    if (!music) return;
    if (next) music.classList.add('is-playing');
    else music.classList.remove('is-playing');
    if (musicHint) musicHint.textContent = next ? 'Reproduciendo…' : 'Pausado';
    if (musicToggle) {
      musicToggle.setAttribute('aria-label', next ? 'Pausar la música' : 'Reproducir la música');
    }
  }

  /* Arranca desde el principio con fundido, con el reproductor ya listo. */
  function musicBegin() {
    musicVolume = 0;
    musicPost('setVolume', [0]);
    musicPost('unMute');
    musicPost('seekTo', [0, true]);
    musicPost('playVideo');
    musicRamp(MUSIC_FULL, MUSIC_FADE_MS);
    setPlaying(true);
  }

  /* El gesto. Si ya está listo, la orden sale ahora mismo, dentro de la
     ventana de permiso; si no, se manda igual y se repite al estar listo. */
  function musicArm() {
    if (!musicFrame || musicBlocked) return;
    if (musicReady) musicBegin();
    else {
      musicPending = true;
      musicPost('playVideo');
    }
  }

  function musicStop() {
    if (!musicFrame) return;
    stopFade();
    musicPending = false;
    musicPost('pauseVideo');
    setPlaying(false);
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', function () {
      if (musicPlaying) {
        stopFade();
        musicPost('pauseVideo');
        setPlaying(false);
      } else {
        musicVolume = MUSIC_FULL;
        musicPost('setVolume', [MUSIC_FULL]);
        musicPost('playVideo');
        setPlaying(true);
      }
    });
  }

  if (musicFrame) {
    /*
     * YouTube exige saber de qué página viene el marco. Abierto desde una
     * dirección web se le manda el "origin" y la canción suena dentro de la
     * carta; abierto desde el disco (doble clic al archivo) no hay origen que
     * mandar —location.origin es la cadena "null"— y YouTube responde 153.
     * En ese caso ni se carga el marco: se va directo al panel que lleva a
     * YouTube, sin el recuadro negro de error de por medio.
     */
    var musicSrc = musicFrame.getAttribute('data-src');
    var origin = window.location.origin;
    if (window.location.protocol === 'file:' || !origin || origin === 'null') {
      musicBlock();
      /* Aquí la canción no tiene la culpa: es el archivo, abierto desde el
         disco. Decir "su dueño bloqueó el embebido" sería mentir. */
      var bTitle = document.getElementById('blocked-title');
      var bHint = document.getElementById('blocked-hint');
      if (bTitle) bTitle.textContent = 'La música no suena en el archivo guardado';
      if (bHint) bHint.textContent = 'Ábrela desde su enlace · O toca para escucharla en YouTube';
    } else {
      musicFrame.src = musicSrc + '&origin=' + encodeURIComponent(origin);
    }

    /* Al cargar: pedirle eventos hasta que responda. */
    musicFrame.addEventListener('load', function () {
      if (listenTimer) clearInterval(listenTimer);
      listenTimer = setInterval(function () {
        if (!musicFrame.contentWindow) return;
        musicFrame.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
      }, LISTEN_STEP_MS);
    });

    window.addEventListener('message', function (e) {
      if (typeof e.data !== 'string' || e.origin.indexOf('youtube') === -1) return;
      var msg;
      try { msg = JSON.parse(e.data); } catch (err) { return; }

      if (msg.event === 'onError' && BLOCKING_ERRORS.indexOf(msg.info) !== -1) {
        /* No se calla sin más: se dice, y se ofrece abrirla en YouTube. */
        musicBlock();
        return;
      }
      if (musicBlocked) return;

      var state;
      if (msg.event === 'onStateChange' && typeof msg.info === 'number') state = msg.info;
      if (msg.event === 'infoDelivery' && msg.info && typeof msg.info.playerState === 'number') {
        state = msg.info.playerState;
      }
      /* La verdad de si suena o no la tiene el reproductor, no nosotros: con el
         video a la vista, quien lee la carta puede pausarlo tocándolo. Cargando
         (3) no cuenta, es un tránsito. */
      if (state === 1) setPlaying(true);
      else if (state === 2 || state === 0) setPlaying(false);

      if ((msg.event === 'onReady' || msg.event === 'infoDelivery') && !musicReady) {
        musicReady = true;
        if (listenTimer) clearInterval(listenTimer);
        listenTimer = null;
        /* En silencio hasta el gesto: el arranque será un fundido */
        musicVolume = 0;
        musicPost('setVolume', [0]);
        if (musicPending) {
          musicPending = false;
          musicBegin();
        }
      }
    });
  }

  /* ---- La cadena de momentos ---- */

  function setState(next) {
    stage.setAttribute('data-state', next);
  }

  function later(fn, ms) {
    sceneTimers.push(setTimeout(fn, ms));
  }

  function clearScenes() {
    sceneTimers.forEach(clearTimeout);
    sceneTimers = [];
    /* Lo clonado se va; lo que se imprimió de una vez sólo se apaga. */
    Array.prototype.forEach.call(screen.querySelectorAll('[data-scene]'), function (el) {
      el.parentNode.removeChild(el);
    });
    if (bloomScene) bloomScene.classList.remove('is-running');
  }

  /**
   * Clona una escena de su plantilla y la pone en pantalla. Es lo más parecido
   * a montar un componente: dentro del template el contenido está inerte, así
   * que sus animaciones arrancan aquí y no al abrir el archivo.
   */
  function mountScene(id) {
    var tpl = document.getElementById(id);
    if (!tpl || !tpl.content.firstElementChild) return null;
    var node = tpl.content.firstElementChild.cloneNode(true);
    node.setAttribute('data-scene', id);
    screen.appendChild(node);
    return node;
  }

  /* Al terminar su momento la escena se va, como la desmontaría React. Dejarla
     puesta significaba una capa de más sobre la carta —invisible, pero por
     encima de ella— y sus animaciones dando vueltas de balde. */
  function dropScene(id) {
    var node = screen.querySelector('[data-scene="' + id + '"]');
    if (node) node.parentNode.removeChild(node);
  }

  function toCard() {
    setState('card');
  }

  /* Con fotos, el estallido de flores tapa la pantalla antes de la carta. */
  function toBurst() {
    dropScene('tpl-memories');
    setState('burst');
    later(toCard, BURST_MS);
  }

  function afterPhrase() {
    dropScene('tpl-phrase');
    if (PHOTOS.length > 0) startMemories();
    else toCard();
  }

  function toPhrase() {
    if (!HAS_PHRASE) {
      afterPhrase();
      return;
    }
    setState('phrase');
    mountScene('tpl-phrase');
    later(afterPhrase, PHRASE_MS);
  }

  function openCard() {
    if (stage.getAttribute('data-state') !== 'envelope') return;
    clearScenes();
    setState('blooming');
    /* EL gesto: aquí y no después, para no salirse de la ventana de permiso */
    musicArm();
    if (bloomScene) bloomScene.classList.add('is-running');
    later(toPhrase, BLOOM_MS);
  }

  function backToEnvelope() {
    clearScenes();
    closePhoto();
    musicStop();
    setState('envelope');
  }

  /* ---- Descubrir los recuerdos ----
   *
   * El momento interactivo: las fotos llegan veladas y cada toque revela una.
   * Al descubrir la última se abanican en el centro, aguantan y dan paso al
   * estallido. Nada de esto ocurre solo: si nadie toca, la escena espera.
   */
  function startMemories() {
    setState('memories');
    var scene = mountScene('tpl-memories');
    if (!scene) {
      toBurst();
      return;
    }

    var cards = scene.querySelectorAll('[data-mem]');
    var left = cards.length;
    var settled = false;

    function settle() {
      settled = true;
      scene.classList.add('is-settling');
      Array.prototype.forEach.call(cards, function (el) {
        el.style.transform = el.getAttribute('data-fan');
        el.style.zIndex = el.getAttribute('data-fanz');
      });
    }

    Array.prototype.forEach.call(cards, function (el) {
      el.addEventListener('click', function () {
        if (settled || el.classList.contains('is-revealed')) return;
        el.classList.add('is-revealed');
        el.setAttribute('aria-pressed', 'true');
        el.setAttribute('aria-label', 'Recuerdo descubierto');
        scene.classList.add('is-started');

        var burst = document.getElementById('tpl-mem-burst');
        if (burst && burst.content.firstElementChild) {
          el.appendChild(burst.content.firstElementChild.cloneNode(true));
        }

        left--;
        if (left > 0) return;
        later(settle, MEM_SETTLE_AT_MS);
        later(function () { scene.classList.add('is-leaving'); }, MEM_LEAVE_AT_MS);
        later(toBurst, MEM_DONE_MS);
      });
    });
  }

  if (envelope) {
    envelope.addEventListener('click', openCard);
  }
  if (closeCard) {
    closeCard.addEventListener('click', function (e) {
      e.stopPropagation();
      backToEnvelope();
    });
  }

  /* ---- Visor de fotos ---- */

  function render() {
    if (current === null || !PHOTOS[current]) return;
    lightboxImg.src = PHOTOS[current];
    counter.textContent = (current + 1) + ' de ' + PHOTOS.length;
  }

  function openPhoto(index) {
    if (!lightbox || index < 0 || index >= PHOTOS.length) return;
    current = index;
    render();
    lightbox.classList.add('is-open');
  }

  function closePhoto() {
    if (!lightbox) return;
    current = null;
    lightbox.classList.remove('is-open');
  }

  function step(delta) {
    if (current === null) return;
    current = (current + delta + PHOTOS.length) % PHOTOS.length;
    render();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-photo]'), function (el) {
    el.addEventListener('click', function () {
      openPhoto(parseInt(el.getAttribute('data-photo'), 10));
    });
  });

  if (lightbox) {
    lightbox.addEventListener('click', closePhoto);
    var frame = document.getElementById('lightbox-frame');
    if (frame) frame.addEventListener('click', function (e) { e.stopPropagation(); });

    var closeBtn = document.getElementById('photo-close');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closePhoto(); });

    var prev = document.getElementById('photo-prev');
    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });

    var next = document.getElementById('photo-next');
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (current !== null) closePhoto();
      else if (stage.getAttribute('data-state') === 'card') backToEnvelope();
    }
    if (current === null) return;
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

})();
`;
