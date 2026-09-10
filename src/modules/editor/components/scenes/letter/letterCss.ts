import { HOLD_MS, RING_C, SIGN_FILL_AT_MS, SIGN_FILL_MS, SIGN_MS } from './letterTiming';

/**
 * Hoja de estilos de la escena de la carta.
 *
 * Va como cadena y se inyecta con un `<style>` dentro de la escena: son
 * animaciones y clases que solo existen dentro del teléfono, y así el visor
 * y la previa del editor comparten exactamente el mismo CSS sin tocar
 * `index.css`. Vive aparte de la vista para que la escena se lea como
 * marcado y no como quinientas líneas de estilos. Los tiempos que interpola
 * salen de `letterTiming`, los mismos que usan los temporizadores.
 */
export const LETTER_CSS = `
.letter {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --script: 'Great Vibes', 'Playfair Display', cursive;
}

/* El scroll vive en un hijo, no en la raíz: así el aviso de "hay más abajo"
   puede quedarse fijo sobre la pantalla en vez de irse con el contenido. */
.letter__scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.letter__scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }

.letter__hint {
  position: absolute;
  left: 50%;
  bottom: 16px;
  z-index: 20;
  pointer-events: none;
  transform: translateX(-50%);
  opacity: 0;
  animation: hintIn 600ms var(--ease) 1400ms forwards;
}
.letter__hint.is-gone { animation: hintOut 300ms var(--ease) forwards; }
.letter__hint-bob { display: block; line-height: 0; animation: hintBob 2.2s var(--ease) infinite; }
@keyframes hintIn  { to { opacity: 0.7; } }
@keyframes hintOut { to { opacity: 0; } }
@keyframes hintBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(5px); }
}

/* ---- Revelado por scroll ---- */
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 600ms var(--ease), transform 600ms var(--ease);
  will-change: opacity, transform;
}
.reveal.is-in { opacity: 1; transform: translateY(0); }

/* ---- Hoja ---- */
.letter-sheet {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 0 22px 30px;
  border-radius: 22px;
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.35);
  transform-origin: 50% 0%;
}
/* La hoja se asienta como papel que se acaba de desdoblar */
.is-active .letter-sheet { animation: sheetUnfold 800ms var(--ease) both; }
@keyframes sheetUnfold {
  from { opacity: 0; transform: perspective(1400px) rotateX(-18deg) translateY(-12px) scale(0.97); }
  to   { opacity: 1; transform: perspective(1400px) rotateX(0deg) translateY(0) scale(1); }
}
.letter-sheet__layer { position: absolute; inset: 0; border-radius: 22px; pointer-events: none; }
.letter-sheet__edge { position: absolute; inset: 8px; border-radius: 16px; pointer-events: none; }
.letter-sheet__monogram {
  position: absolute;
  left: 0; right: 0; top: 150px;
  text-align: center;
  font-family: var(--serif);
  font-weight: 700;
  font-size: 9rem;
  line-height: 1;
  opacity: 0.05;
  pointer-events: none;
  user-select: none;
}

/* ---- Decoración de fondo ----
 * Los objetos y motivos del tema viven DETRÁS de la hoja, no en sus márgenes:
 * a 360 px el margen de la hoja es de 22 px y ahí no cabe nada legible. Medio
 * tapados por el papel, además, dan profundidad en vez de ruido.
 */
/*
 * Escenario de la hoja: envuelve SÓLO la hoja, no toda la columna.
 *
 * Con la capa cubriendo la columna entera, el dibujo del 82% caía dentro del
 * cierre y se amontonaba con el lacre y con los dos objetos que ya lo
 * acompañan. Acotada a la hoja, los cuatro se reparten a lo largo de la
 * lectura y el final queda despejado.
 *
 * Va a sangre por los lados —margen negativo y el mismo relleno— para que los
 * dibujos sigan asomando desde el borde de la pantalla y no desde el de la
 * hoja, que es donde quedarían si la capa midiera lo mismo que el papel.
 */
.letter-stage {
  position: relative;
  align-self: stretch;
  margin-inline: -24px;
  padding-inline: 24px;
  display: flex;
  justify-content: center;
}
.letter-decor {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.letter-decor__gift { position: absolute; line-height: 0; }
.letter-decor__gift--l { left: -24px; }
.letter-decor__gift--r { right: -24px; }
.letter-decor__motif { position: absolute; line-height: 0; }

/* ---- Guirnalda de la cabecera ---- */
.letter-head__garland { display: block; margin: 0 auto 2px; line-height: 0; opacity: 0.9; }

/* ---- Separador entre bloques de texto ---- */
.letter-divider { display: flex; justify-content: center; margin: 2px 0 20px; }
.letter-head {
  position: relative;
  text-align: center;
  margin: 0 -22px 18px;
  padding: 26px 22px 12px;
  border-radius: 22px 22px 0 0;
}
.letter-head__eyebrow {
  display: block;
  font-family: var(--serif);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.75;
  margin: 0 0 4px;
}
.letter-head__para {
  font-family: var(--serif);
  font-size: 18px;
  line-height: 1.2;
  margin: 0;
}
.letter-head__name {
  font-family: var(--script);
  font-size: 2.3rem;
  line-height: 1.05;
  margin: 2px 0 6px;
  overflow-wrap: anywhere;
}

/* ---- Cuerpo ---- */
.letter-body { position: relative; text-align: left; }
.letter-greeting {
  font-family: var(--serif);
  font-size: 17px;
  font-style: italic;
  font-weight: 600;
  line-height: 1.6;
  margin: 0 0 14px;
}
.letter-p {
  font-family: var(--serif);
  font-size: 17px;
  line-height: 1.7;
  margin: 0 0 1em;
  opacity: 0.95;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}
.letter-p.reveal { opacity: 0; }
.letter-p.reveal.is-in { opacity: 0.95; }

/* Foto sola entre trozos de texto: alterna lado, como en un álbum */
/*
 * La foto flota dentro del párrafo y el texto la rodea, como en una revista.
 *
 * Antes cada foto se llevaba una línea entera para ella sola: el texto se
 * cortaba en seco, seguía debajo y la lectura quedaba a saltos. Flotando, la
 * foto se apoya en el costado y el párrafo la abraza.
 */
/*
 * La foto se sale del papel por el lado de fuera.
 *
 * El margen negativo es mayor que el relleno de la hoja (22 px), así que la
 * polaroid asoma unos 10 px por el borde. Gana el texto, que es lo que se
 * buscaba: encajada dentro le quedaban ~110 px de línea al lado, tres o
 * cuatro palabras, y se leía a trompicones. Y de paso la foto se lee como
 * puesta encima de la carta, no pegada dentro.
 */
.letter-float { display: block; width: 42%; max-width: 132px; }
.letter-float--left  { float: left;  margin: 3px 14px 10px -32px; }
.letter-float--right { float: right; margin: 3px -32px 10px 14px; }
.letter-float .letter-polaroid { width: 100%; }

/* Suelta al final, sin párrafo detrás al que abrazar */
.letter-photo {
  display: flex;
  clear: both;
  margin: 4px 0 22px;
}
.letter-photo--left { justify-content: flex-start; padding-left: 6px; }
.letter-photo--right { justify-content: flex-end; padding-right: 6px; }
.letter-photo .letter-polaroid { width: min(168px, 60%); }

/* Nada de esto debe quedar abrazando una foto: cierra el flotado */
.letter-divider, .letter-gallery, .sign, .letter-greeting { clear: both; }

/* Sobrantes al final: cuadrícula de 2, nunca una hilera */
.letter-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 14px;
  margin: 6px 0 22px;
}
.letter-gallery .letter-polaroid { width: calc(50% - 7px); max-width: 180px; }
.letter-polaroid {
  margin: 0; padding: 6px 6px 16px; border: 1px solid rgba(0,0,0,0.08);
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 8px 20px -10px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 300ms var(--ease);
}
.letter-polaroid:active { transform: scale(0.97) !important; }
.letter-polaroid img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: #f3f4f6;
  pointer-events: none;
}

/* ---- Firma ---- */
.sign {
  margin-top: 26px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}
.sign__seal {
  flex-shrink: 0;
  width: 40px; height: 40px;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
}
.sign__text { text-align: right; min-width: 0; flex: 1; }
.sign__label {
  display: block;
  font-family: var(--serif);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  opacity: 0.65;
  margin-bottom: 2px;
}
.sign__svg { display: block; margin-left: auto; overflow: visible; }
.sig-text { font-family: var(--script); }
.sig-stroke {
  fill: none;
  stroke-width: 0.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
}
.sig-fill { opacity: 0; }
.is-writing .sig-stroke { animation: sigWrite ${SIGN_MS}ms var(--ease) forwards; }
.is-writing .sig-fill { animation: sigFill ${SIGN_FILL_MS}ms var(--ease) ${SIGN_FILL_AT_MS}ms forwards; }
@keyframes sigWrite { to { stroke-dashoffset: 0; } }
@keyframes sigFill { to { opacity: 1; } }

/* ---- Reproductor ---- */
.player {
  position: relative;
  z-index: 2;
  margin: 22px auto 0;
  width: 100%;
  max-width: 320px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px 8px 8px;
  border-radius: 999px;
}
.player__btn {
  width: 44px; height: 44px;
  border-radius: 999px;
  border: 0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 150ms var(--ease);
}
.player__btn:active { transform: scale(0.94); }
.player__meta { flex: 1; min-width: 0; text-align: left; }
.player__title { margin: 0; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.player__hint { margin: 2px 0 0; font-size: 11px; opacity: 0.65; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ---- Sello final ---- */
.seal {
  position: relative;
  margin-top: 34px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transition: opacity 700ms var(--ease);
}
.seal.is-ready { opacity: 1; }
/*
 * A 12px con 0.2em de espaciado el rótulo medía 298px dentro de una tarjeta de
 * 298: partía en dos líneas y la segunda se montaba sobre los objetos de los
 * lados. Más pequeño y menos espaciado entra de sobra en una sola línea.
 */
.seal__label {
  margin: 0 0 12px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: opacity 300ms var(--ease);
}
.is-sealed .seal__label { opacity: 0; }
.seal__stage {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  width: 100%;
  max-width: 300px;
}
.seal__rest {
  position: absolute;
  bottom: 4px; left: 50%;
  width: 190px; height: 24px;
  transform: translateX(-50%);
  border-radius: 50%;
  filter: blur(10px);
}
.seal__gift { position: relative; }
.seal__gift--a { transform: rotate(-6deg); }
.seal__gift--b { transform: rotate(7deg); }
.seal__btn {
  position: relative;
  width: 96px; height: 96px;
  margin: 0 6px 6px;
  padding: 0;
  border: 0;
  background: none;
  border-radius: 999px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
.seal__btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
.is-sealed .seal__btn { cursor: default; }
.seal__ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.seal__ring-track { fill: none; stroke-width: 2; }
.seal__ring-bar {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: ${RING_C.toFixed(1)};
  stroke-dashoffset: ${RING_C.toFixed(1)};
}
.is-holding .seal__ring-bar { animation: sealRing ${HOLD_MS}ms linear forwards; }
.is-sealed .seal__ring { opacity: 0; transition: opacity 400ms var(--ease); }
.is-sealed .seal__ring-bar { stroke-dashoffset: 0; }
.seal__spread {
  position: absolute;
  left: 50%; top: 50%;
  width: 72px; height: 72px;
  margin: -36px 0 0 -36px;
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
}
.is-sealed .seal__spread { animation: sealSpread 700ms var(--ease) forwards; }
.seal__wax {
  position: absolute;
  left: 50%; top: 50%;
  width: 62px; height: 62px;
  margin: -31px 0 0 -31px;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 18px -6px rgba(0, 0, 0, 0.5);
  transition: transform 160ms var(--ease);
}
.is-holding .seal__wax { transform: scale(0.93); }
.is-sealed .seal__wax { animation: sealStamp 520ms var(--ease) forwards; }
.seal__done {
  margin: 12px 0 0;
  font-family: var(--script);
  font-size: 1.9rem;
  line-height: 1.1;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 500ms var(--ease) 250ms, transform 500ms var(--ease) 250ms;
}
.is-sealed .seal__done { opacity: 1; transform: translateY(0); }
@keyframes sealRing { to { stroke-dashoffset: 0; } }
@keyframes sealStamp {
  0%   { transform: scale(0.93); }
  45%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes sealSpread {
  0%   { transform: scale(0.6); opacity: 0.45; }
  100% { transform: scale(1.7); opacity: 0; }
}

/* ---- Volver a verla ---- */
.replay {
  margin-top: 28px;
  min-height: 44px;
  padding: 0 22px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid;
  background: none;
  font-family: var(--sans, inherit);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 220ms var(--ease), transform 220ms var(--ease);
}
.replay:hover { opacity: 1; }
.replay:active { transform: scale(0.97); }

/* ---- Marca ---- */
.brand {
  margin: 28px 0 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0.45;
}

/* "Reducir movimiento": la firma, el sello y el desdoblado de la hoja se
   quedan (son el cierre de la carta). Se apaga lo secundario: el revelado
   escalonado al hacer scroll y el chevron que bota. */
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .letter-p.reveal { opacity: 0.95; }
  .letter__hint { animation: none; opacity: 0.7; }
  .letter__hint-bob { animation: none; }
}

/* "Nuestra canción": el reproductor visible, bajo el membrete y antes del texto */
.letter-song { position: relative; z-index: 1; margin: 6px 4px 12px; }
`;
