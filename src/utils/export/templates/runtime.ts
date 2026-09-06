/**
 * Script del documento exportado.
 *
 * Todo el estado vive en un único atributo `data-state` del escenario
 * (envelope / blooming / card) y el CSS reacciona a él. Antes se añadían y
 * quitaban clases de Tailwind a mano en cada elemento, lo que dejaba de
 * funcionar en cuanto una de esas clases no existía en la versión del CDN.
 */
export const buildRuntime = (photos: string[]): string => `
(function () {
  var PHOTOS = ${JSON.stringify(photos)};
  var BLOOM_MS = 2800;

  var stage = document.getElementById('stage');
  var envelope = document.getElementById('envelope');
  var closeCard = document.getElementById('close-card');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var counter = document.getElementById('lightbox-counter');
  var player = document.getElementById('player');

  var bloomTimer = null;
  var current = null;

  function setState(next) {
    stage.setAttribute('data-state', next);
  }

  function openCard() {
    if (stage.getAttribute('data-state') !== 'envelope') return;
    setState('blooming');
    if (bloomTimer) clearTimeout(bloomTimer);
    bloomTimer = setTimeout(function () { setState('card'); }, BLOOM_MS);
  }

  function backToEnvelope() {
    if (bloomTimer) clearTimeout(bloomTimer);
    closePhoto();
    setState('envelope');
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

  /* ---- Canción ---- */

  if (player) {
    var meta = player.querySelector('[data-song]');
    if (meta) {
      meta.addEventListener('click', function () {
        window.open(meta.getAttribute('data-song'), '_blank', 'noopener');
      });
    }
  }
})();
`;
