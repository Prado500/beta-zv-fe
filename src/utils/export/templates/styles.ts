import type { ThemePalette } from '../../themePalette';
import { withAlpha } from '../../themePalette';
import { edgeCss, textureCss, type ThemeDecor } from '../../themeDecor';
import { stageColors } from '../../stageTheme';
import { BLOOM_CSS } from '../../bloomArt';
import { PHRASE_CSS } from '../../phraseLayout';
import { MEM_CSS } from '../../memoriesLayout';

/**
 * Hoja de estilos completa del documento exportado.
 *
 * El export ya no depende del CDN de Tailwind: la versión que cargaba era la 3
 * mientras el marcado usaba nombres de la 4 (bg-linear-to-br, rounded-xs,
 * shadow-xs...), así que degradados y radios se caían en silencio. Con CSS
 * propio la carta además abre sin internet, que es lo que se espera de un
 * archivo que alguien guarda de recuerdo.
 */
export const buildStyles = (palette: ThemePalette, decor: ThemeDecor): string => {
  const texture = textureCss(decor.texture, palette.text);
  const edge = edgeCss(decor.edge, decor.metal);
  /* Los mismos que usa el visor público: `utils/stageTheme`. */
  const stage = stageColors(palette);

  return `
:root {
  --bg: ${palette.bg};
  --card-bg: ${palette.cardBg};
  --text: ${palette.text};
  --accent: ${palette.accent};
  --border: ${palette.border};
  --accent-soft: ${withAlpha(palette.accent, 0.12)};
  --stage-base: ${stage.base};
  --stage-glow-1: ${stage.glow1};
  --stage-glow-2: ${stage.glow2};
  --stage-ink: ${stage.ink};
  --stage-confetti: ${stage.confetti};
  --serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --sans: 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --script: 'Great Vibes', 'Playfair Display', cursive;
}

* { box-sizing: border-box; -ms-overflow-style: none; scrollbar-width: none; }
*::-webkit-scrollbar { display: none; }

html, body { height: 100%; }
body {
  margin: 0;
  font-family: var(--sans);
  color: var(--text);
  background-color: var(--stage-base);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
}

/* ---------- Escenario de escritorio ---------- */
/* En móvil el teléfono ocupa la pantalla; el escenario aparece de 640px arriba. */
.stage {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.stage__glow, .stage__grain, .stage__vignette, .stage__decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.stage__glow {
  background:
    radial-gradient(48% 42% at 22% 28%, var(--stage-glow-1) 0%, transparent 70%),
    radial-gradient(52% 46% at 80% 74%, var(--stage-glow-2) 0%, transparent 70%);
  filter: blur(28px);
}
.stage__grain {
  opacity: 0.5;
  background-image:
    radial-gradient(rgba(94,10,27,0.06) 0.5px, transparent 0.5px),
    radial-gradient(rgba(94,10,27,0.04) 0.5px, transparent 0.5px);
  background-size: 13px 13px, 21px 21px;
  background-position: 0 0, 7px 9px;
}
.stage__vignette {
  background: radial-gradient(125% 90% at 50% 45%, transparent 52%, rgba(0,0,0,0.2) 100%);
}
.stage__decor { display: none; }
.stage__heart {
  position: absolute;
  color: var(--stage-confetti);
  animation: stageFloat 8s ease-in-out infinite;
}
.stage__rose { position: absolute; bottom: -20px; opacity: 0.28; }
.stage__rose--left { left: 3%; transform: rotate(-16deg); }
.stage__rose--right { right: 3%; transform: rotate(20deg); }
.stage__caption {
  display: none;
  position: absolute;
  left: 50%;
  top: 5vh;
  transform: translateX(-50%);
  text-align: center;
  color: var(--stage-ink);
  pointer-events: none;
}
.stage__caption-script { font-family: var(--script); font-size: 38px; line-height: 1; }

@media (min-width: 640px) {
  .stage__decor { display: block; }
}
@media (min-width: 900px) and (min-height: 940px) {
  .stage__caption { display: block; }
}

/* ---------- La pieza ----------
 * En móvil ocupa la pantalla entera. En escritorio NO se dibuja un teléfono
 * de mentira: un marco con muesca dentro de un monitor es disfraz y se nota.
 * Se presenta como lo que es, una tarjeta apoyada sobre la hoja.
 */
.phone {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--card-bg);
  z-index: 2;
}
.phone__notch { display: none; }
.phone__screen {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--card-bg);
}
.phone__bg { position: absolute; inset: 0; background: var(--bg); z-index: 0; pointer-events: none; }

@media (min-width: 640px) {
  .phone {
    height: 820px;
    max-height: 92vh;
    border-radius: 28px;
    border: 1px solid var(--border);
    box-shadow:
      0 40px 80px -24px rgba(0, 0, 0, 0.35),
      0 4px 14px -6px rgba(0, 0, 0, 0.18);
  }
  .phone__screen { border-radius: 27px; }
}

/* ---------- Capas de pantalla ---------- */
.envelope {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  background: rgba(0,0,0,0.05);
  backdrop-filter: blur(2px);
  transition: opacity 700ms ease, transform 700ms ease;
}
/* El sobre se aparta en cuanto deja de ser el momento, sea cual sea el que sigue */
.stage:not([data-state="envelope"]) .envelope {
  opacity: 0;
  transform: scale(1.1);
  pointer-events: none;
}

.envelope__stack {
  position: relative;
  width: 250px;
}
.envelope__card {
  position: relative;
  width: 100%;
  padding: 92px 20px 24px;
  border-radius: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  box-shadow: 0 22px 44px -18px rgba(0, 0, 0, 0.45);
}
.envelope__grain {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
  opacity: ${texture.opacity};
  background-image: ${texture.backgroundImage};
  background-size: ${texture.backgroundSize};
}
${
  edge
    ? `.envelope__edge {
  position: absolute;
  inset: 8px;
  border-radius: 10px;
  pointer-events: none;
  border: ${edge.border};${edge.boxShadow ? `
  box-shadow: ${edge.boxShadow};` : ''}
}`
    : '.envelope__edge { display: none; }'
}
.envelope__fold {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 10;
  pointer-events: none;
}
.envelope__flap {
  display: block;
  width: 100%;
  height: 100%;
}
.envelope__seal-anchor {
  position: absolute;
  left: 50%;
  top: 56px;
  transform: translate(-50%, -50%);
}
.envelope__card .sheet__corner { opacity: 0.55; }
.envelope__card .sheet__corner--bl { bottom: 12px; left: 12px; top: auto; right: auto; }
.envelope__card .sheet__corner--br { bottom: 12px; right: 12px; top: auto; left: auto; }
.envelope__content { position: relative; text-align: center; }
.envelope__title {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.25;
}
.envelope__content .card__ornament { margin: 8px auto; }
.envelope__label {
  font-family: var(--serif);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text);
  opacity: 0.65;
  margin: 0;
}
.envelope__sender {
  font-family: var(--script);
  font-size: 1.9rem;
  line-height: 1;
  padding-bottom: 2px;
  color: var(--accent);
  margin: 0;
}
.envelope__seal {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border: 2px solid ${withAlpha(decor.metal, 0.75)};
  box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.5);
  animation: sealBeat 2.6s ease-in-out infinite;
}
.envelope__hint {
  margin-top: 28px;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text);
  background: ${withAlpha(palette.cardBg, 0.75)};
  padding: 6px 16px;
  border-radius: 999px;
  opacity: 0.9;
  animation: hintPulse 2.4s ease-in-out infinite;
}

/* ---------- Carta ---------- */
.card {
  position: absolute;
  inset: 0;
  z-index: 20;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  overflow-y: auto;
  overflow-x: hidden;
  transition: opacity 900ms ease, transform 900ms ease;
}
[data-state="card"] .card { opacity: 1; transform: scale(1); pointer-events: auto; }

.card__inner {
  position: relative;
  z-index: 10;
  width: 100%;
  min-height: 100%;
  padding: 48px 16px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.card__close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.22);
  color: #fff;
  font-family: var(--sans);
  font-size: 11px;
  padding: 6px 14px;
  border: 0;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: background 200ms ease;
}
.card__close:hover { background: rgba(0,0,0,0.34); }
.card__eyebrow {
  font-family: var(--serif);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  opacity: 0.8;
  display: block;
  margin-bottom: 8px;
}
.card__title {
  font-family: var(--serif);
  font-size: 26px;
  line-height: 1.2;
  color: var(--text);
  margin: 0 auto;
  max-width: 280px;
}
.card__ornament { margin: 18px auto; display: block; }
.card__body {
  width: 100%;
  max-width: 280px;
  margin: 8px auto 0;
  padding: 0 8px;
  position: relative;
  z-index: 10;
}
.card__body::after { content: ''; display: table; clear: both; }
.card__greeting {
  font-family: var(--serif);
  font-size: 15px;
  font-style: italic;
  font-weight: 600;
  color: var(--accent);
  text-align: left;
  margin: 0 0 12px;
  clear: both;
}
.card__paragraph {
  font-family: var(--serif);
  font-size: 14px;
  line-height: 1.8;
  color: var(--text);
  opacity: 0.95;
  text-align: left;
  margin: 0 0 8px;
  overflow-wrap: break-word;
}
.card__spacer { height: 14px; clear: none; }
.card__signature {
  font-family: var(--script);
  font-size: 30px;
  line-height: 1.15;
  text-align: right;
  margin-top: 26px;
  color: var(--accent);
  clear: both;
}
.card__gallery {
  padding-top: 24px;
  padding-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  clear: both;
}

/* ---------- Polaroids ---------- */
.polaroid {
  height: fit-content;
  cursor: pointer;
  position: relative;
  z-index: 20;
  background: #fff;
  padding: 6px 6px 16px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 6px 14px -6px rgba(0,0,0,0.35);
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 400ms ease;
  will-change: transform;
}
.polaroid:hover {
  z-index: 40;
  transform: scale(1.1) rotate(0deg);
  box-shadow: 0 16px 32px -8px rgba(0,0,0,0.35);
}
.polaroid__frame {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
  overflow: hidden;
  border-radius: 2px;
}
.polaroid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
.polaroid:hover img { transform: scale(1.12); }
/*
 * La foto se sale del papel por el lado de fuera, igual que en la previa.
 * El margen negativo salva el relleno del cuerpo (8 px) y el de la hoja
 * (18 px) y aún asoma unos 10 px: al texto le quedan 36 px más de línea al
 * lado, que encajado dentro daban tres palabras justas.
 */
.polaroid--inline { width: 84px; margin-bottom: 10px; margin-top: 4px; }
.polaroid--inline.is-left { float: left; margin-right: 14px; margin-left: -36px; }
.polaroid--inline.is-right { float: right; margin-left: 14px; margin-right: -36px; }
.polaroid--gallery { width: 92px; padding-bottom: 20px; }

/* ---------- Reproductor ---------- */
/*
 * Va en el flujo, justo bajo el cierre de flores, y no anclado al borde de la
 * pantalla: anclado dejaba un vacío largo entre el final de la carta y la
 * barra siempre que el mensaje era corto. Y toma los colores del tema, no el
 * blanco y el gris pizarra de antes.
 */
/*
 * Módulo de música: el video encima, los controles debajo, apilados.
 *
 * La pantalla se ve DE VERDAD. Antes aquí no había reproductor: la barra sólo
 * abría YouTube en otra pestaña. Ahora la canción suena dentro de la carta, y
 * para eso el marco tiene que ser visible —Chrome y Safari de móvil no dejan
 * sonar un iframe que consideran oculto.
 */
.music {
  position: relative;
  z-index: 20;
  margin: 22px auto 0;
  width: 88%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.music__screen {
  position: relative;
  width: 100%;
  max-width: 280px;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  background: #000;
  border: 1px solid ${withAlpha(decor.metal, 0.55)};
  box-shadow: 0 10px 30px -12px ${withAlpha(palette.text, 0.55)};
}
.music__screen iframe { display: block; width: 100%; height: 100%; border: 0; }

/*
 * Si YouTube no deja embeber la canción no hay nada que enseñar, pero el marco
 * NO se quita del documento: sacarlo lo recargaría. Se recoge a nada.
 */
.music.is-blocked .music__screen {
  position: absolute;
  width: 1px;
  height: 1px;
  max-width: none;
  opacity: 0;
  pointer-events: none;
  border: 0;
  box-shadow: none;
}
/*
 * Los dos paneles se imprimen siempre y aquí se decide cuál se ve. Van con la
 * clase del módulo por delante a propósito: .player trae su propio
 * display:flex más abajo en esta hoja, y con un solo selector de clase
 * ganaría por orden y se verían los dos a la vez.
 */
.music .player--blocked { display: none; }
.music.is-blocked .player--live { display: none; }
.music.is-blocked .player--blocked { display: flex; }
/*
 * El aviso es justo el texto que hay que leer, así que se le deja partir en
 * varias líneas. Con el recorte de la barra normal quedaba en "La música no
 * suena en el archi…", que no dice nada. Y en varias líneas la píldora deja de
 * tener sentido: se redondea como tarjeta.
 */
.player--blocked { border-radius: 18px; align-items: flex-start; }
.player--blocked .player__title,
.player--blocked .player__hint {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.35;
}

.player {
  position: relative;
  z-index: 20;
  margin: 22px auto 0;
  width: 88%;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: ${withAlpha(palette.cardBg, 0.95)};
  backdrop-filter: blur(16px);
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid ${withAlpha(decor.metal, 0.5)};
  box-shadow: 0 12px 28px -14px ${withAlpha(palette.text, 0.6)};
}
.player__button {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  flex-shrink: 0;
  background: var(--accent);
  color: var(--card-bg);
  border: 1px solid ${withAlpha(decor.metal, 0.55)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px -6px ${withAlpha(palette.text, 0.55)};
  transition: transform 200ms ease;
  text-decoration: none;
}
.player__button:hover { transform: scale(1.06); }
.player__button:active { transform: scale(0.94); }
/* El botón vivo es un <button>, no un <a>: hay que desarmar el estilo nativo */
button.player__button { padding: 0; font: inherit; cursor: pointer; -webkit-appearance: none; appearance: none; }
/* El de la variante bloqueada no invita a nada: sólo acompaña al aviso */
.player__button--quiet {
  background: ${withAlpha(palette.accent, 0.15)};
  color: var(--accent);
}
.player__ico { display: flex; }
.music:not(.is-playing) .player__ico--pause { display: none; }
.music.is-playing .player__ico--play { display: none; }
.player__meta { flex: 1; text-align: left; overflow: hidden; }
.music .player { margin: 0; width: 100%; }
.player--blocked { text-decoration: none; }
.player__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player__hint {
  font-size: 9px;
  color: var(--text);
  opacity: 0.65;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player__icon { color: var(--accent); opacity: 0.45; flex-shrink: 0; transition: opacity 200ms ease; }
.music.is-playing .player__icon { animation: eqPulse 1.7s ease-in-out infinite; }
@keyframes eqPulse {
  0%, 100% { opacity: 0.9; }
  50%      { opacity: 0.35; }
}

/* ---------- Visor de fotos ---------- */
.lightbox {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}
.lightbox.is-open { opacity: 1; pointer-events: auto; }
.lightbox__close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.85);
  border: 0;
  border-radius: 999px;
  padding: 8px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: color 200ms ease, background 200ms ease;
}
.lightbox__close:hover { color: #fff; background: rgba(255,255,255,0.22); }
.lightbox__frame {
  position: relative;
  background: #fff;
  padding: 12px 12px 30px;
  border-radius: 3px;
  box-shadow: 0 30px 60px -20px rgba(0,0,0,0.8);
  max-width: 85%;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: lightboxIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.lightbox__img {
  max-width: 100%;
  max-height: 55vh;
  object-fit: contain;
  border-radius: 2px;
  background: rgba(0,0,0,0.05);
}
.lightbox__counter {
  font-family: var(--serif);
  font-size: 12px;
  color: #64748b;
  margin: 12px 0 0;
  font-weight: 500;
}
.lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 6px;
  cursor: pointer;
  transition: background 200ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox__nav:hover { background: rgba(0,0,0,0.72); }
.lightbox__nav--prev { left: 8px; }
.lightbox__nav--next { right: 8px; }

/* ---------- Estallido de flores ---------- */
.blooms {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
}
.bloom {
  position: absolute;
  width: 144px;
  height: 144px;
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}
.bloom img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
}
/*
 * El estallido ya no arranca al abrir el sobre: ahora es el último momento,
 * justo antes de la carta, después de descubrir los recuerdos. Lo que sale del
 * sobre es la floración de tallos.
 */
[data-state="burst"] .bloom {
  animation: flowerBloom 2.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* ---------- Fondos ambientales ---------- */
.ambient {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  z-index: 1;
}
.ambient__orb { position: absolute; border-radius: 999px; filter: blur(44px); }
.ambient__sprite { position: absolute; }
.ambient__glyph { position: absolute; }
.ambient__pulse { animation: softPulse 3.5s ease-in-out infinite; }

@keyframes flowerBloom {
  0%   { transform: translate3d(0,0,0) scale(0) rotate(calc(var(--rot) - 20deg)); opacity: 0; }
  25%  { transform: translate3d(var(--tx), var(--ty), 0) scale(var(--scale)) rotate(var(--rot)); opacity: 1; }
  65%  { transform: translate3d(var(--tx), var(--ty), 0) scale(var(--scale)) rotate(var(--rot)); opacity: 1; }
  100% { transform: translate3d(calc(var(--tx) * 1.05), calc(var(--ty) * 1.05), 0) scale(calc(var(--scale) * 1.05)) rotate(calc(var(--rot) + 10deg)); opacity: 0; }
}
@keyframes lightboxIn {
  0%   { transform: scale(0.7) translateY(12px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes sealBeat {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.1); }
}
@keyframes hintPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
@keyframes softPulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
@keyframes stageFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-9px); }
}

/* Keyframes de los fondos ambientales. Antes se referenciaban desde los
   estilos en línea pero nunca se definían en el documento exportado: por eso
   ninguna animación de fondo llegaba a correr. */
@keyframes floatUpRomantic {
  0%   { top: 110%; transform: translateX(0) scale(0.7) rotate(0deg); opacity: 0; }
  20%  { opacity: 0.6; }
  80%  { opacity: 0.6; }
  100% { top: -20%; transform: translateX(var(--tx)) scale(1.1) rotate(18deg); opacity: 0; }
}
@keyframes petalFall {
  0%   { top: -10%; transform: translateX(0) rotate(0deg); opacity: 0; }
  20%  { opacity: 0.7; }
  80%  { opacity: 0.7; }
  100% { top: 110%; transform: translateX(var(--tx)) rotate(180deg); opacity: 0; }
}
@keyframes stardustRise {
  0%   { top: 110%; opacity: 0; }
  30%  { opacity: 0.8; }
  80%  { opacity: 0.8; }
  100% { top: -10%; opacity: 0; }
}
@keyframes sparkleGlow {
  0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.2; }
  50%      { transform: scale(1.3) rotate(45deg); opacity: 0.85; }
}
@keyframes leafDrift {
  0%   { top: -10%; transform: translateX(0) rotate(0deg); opacity: 0; }
  25%  { opacity: 0.6; }
  75%  { opacity: 0.6; }
  100% { top: 110%; transform: translateX(var(--tx)) rotate(90deg); opacity: 0; }
}
@keyframes fireflyFloat {
  0%, 100% { transform: translate(0, 0); opacity: 0.2; }
  50%      { transform: translate(var(--tx), var(--ty)); opacity: 0.9; }
}
@keyframes butterflyFly {
  0%   { top: 110%; transform: translateX(0) scale(0.8) rotate(-10deg); opacity: 0; }
  30%  { opacity: 0.5; }
  70%  { opacity: 0.5; }
  100% { top: -15%; transform: translateX(var(--tx)) scale(1.1) rotate(15deg); opacity: 0; }
}
@keyframes ambientGlow {
  0%   { transform: scale(1) translate(0, 0); opacity: 0.4; }
  100% { transform: scale(1.15) translate(3%, 3%); opacity: 0.7; }
}
@keyframes bokehFloat {
  0%   { top: 110%; transform: scale(0.8); opacity: 0; }
  30%  { opacity: 0.6; }
  80%  { opacity: 0.6; }
  100% { top: -15%; transform: scale(1.2); opacity: 0; }
}

/* ---------- La hoja de la carta ---------- */
/* Va después de .card__* a propósito: reajusta el cuerpo, que antes era el
   contenedor y ahora vive dentro del papel. */
.sheet {
  position: relative;
  width: 100%;
  max-width: 279px;
  margin: 6px auto 0;
  padding: 26px 18px 30px;
  border-radius: 22px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.35);
}
.sheet__grain {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  pointer-events: none;
  opacity: ${texture.opacity};
  background-image: ${texture.backgroundImage};
  background-size: ${texture.backgroundSize};
}
${
  edge
    ? `.sheet__edge {
  position: absolute;
  inset: 8px;
  border-radius: 16px;
  pointer-events: none;
  border: ${edge.border};${edge.boxShadow ? `
  box-shadow: ${edge.boxShadow};` : ''}
}`
    : '.sheet__edge { display: none; }'
}
.sheet__monogram {
  position: absolute;
  left: 0;
  right: 0;
  top: 150px;
  text-align: center;
  font-family: var(--serif);
  font-weight: 700;
  font-size: 9rem;
  line-height: 1;
  color: var(--accent);
  opacity: 0.05;
  pointer-events: none;
  user-select: none;
}
.sheet__corner { position: absolute; pointer-events: none; opacity: 0.6; }
.sheet__corner--tl { top: 8px; left: 8px; }
.sheet__corner--br { bottom: 8px; right: 8px; }
.sheet__content { position: relative; }
.sheet__head {
  position: relative;
  text-align: center;
  margin: -26px -18px 12px;
  padding: 24px 18px 10px;
  border-radius: 22px 22px 0 0;
  background: linear-gradient(
    to bottom,
    ${withAlpha(palette.accent, 0.1)},
    ${withAlpha(palette.accent, 0)}
  );
  border-bottom: 1px solid ${withAlpha(decor.metal, 0.35)};
}

/* El papel tapaba el fondo animado; esta capa lo deja pasar por encima */
.ambient--front {
  z-index: 22;
  opacity: 0.45;
}

.card__recipient {
  font-family: var(--script);
  font-size: 2.2rem;
  line-height: 1;
  margin: 0 0 2px;
  color: var(--accent);
}
.card__title { font-size: 18px; margin-bottom: 0; }
.card__eyebrow { font-size: 10px; letter-spacing: 0.18em; margin-bottom: 2px; }
.card__ornament { margin: 6px auto 10px; }
.card__body { max-width: none; margin: 0; padding: 0; }

.sheet__sign {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  clear: both;
}
.sheet__seal {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: ${withAlpha(palette.accent, 0.18)};
  border: 1px solid ${withAlpha(palette.accent, 0.35)};
}
.sheet__sign-text { text-align: right; min-width: 0; }
.sheet__sign-label {
  display: block;
  font-family: var(--serif);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  opacity: 0.65;
  color: var(--text);
}
.card__signature {
  display: block;
  font-family: var(--script);
  font-size: 1.65rem;
  line-height: 1.15;
  margin: 0;
  padding-bottom: 2px;
  color: var(--accent);
}

/* ---------- Objetos del tema ----------
 * Ramo, bombones, farol… Van dibujados y no fotografiados (ver themeGifts.ts):
 * el mismo objeto convive con ocho paletas y este archivo se lleva todo dentro.
 */
.envelope__frame {
  position: absolute;
  inset: 10px;
  border-radius: 26px;
  pointer-events: none;
  border: 1px solid ${withAlpha(decor.metal, 0.45)};
  box-shadow: inset 0 0 0 3px ${withAlpha(decor.metal, 0.1)};
}
.envelope > .sheet__corner { opacity: 0.4; }
.envelope > .sheet__corner--tl { top: 20px; left: 20px; }
.envelope > .sheet__corner--tr { top: 20px; right: 20px; left: auto; }
.envelope > .sheet__corner--bl { bottom: 20px; left: 20px; top: auto; right: auto; }
.envelope > .sheet__corner--br { bottom: 20px; right: 20px; top: auto; left: auto; }
.envelope__dust { position: absolute; line-height: 0; pointer-events: none; }
.envelope__garland { display: block; line-height: 0; margin-bottom: 4px; }

.envelope__gifts {
  position: relative;
  z-index: 0;
  width: 100%;
  max-width: 288px;
  /* El sobre les monta encima: sin este solape parecen dos piezas sueltas */
  margin-top: -34px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  pointer-events: none;
}
.envelope__rest {
  position: absolute;
  left: 50%;
  bottom: 6px;
  width: 240px;
  height: 26px;
  transform: translateX(-50%);
  border-radius: 50%;
  filter: blur(10px);
  background: ${withAlpha(palette.text, 0.2)};
}
.envelope__gift { position: relative; line-height: 0; }
.envelope__gift svg { filter: drop-shadow(0 9px 11px ${withAlpha(palette.text, 0.3)}); }
.envelope__gift--left { transform: rotate(-7deg); }
.envelope__gift--right { transform: rotate(8deg); }
/* El sobre por delante de los objetos, y se levanta sobre ellos al pasar */
.envelope__stack { z-index: 1; transition: transform 300ms ease; }
.envelope:hover .envelope__stack { transform: translateY(-4px); }

.card__gift {
  position: absolute;
  z-index: 0;
  line-height: 0;
  pointer-events: none;
  filter: drop-shadow(0 9px 11px ${withAlpha(palette.text, 0.3)});
}
.card__gift--left { left: -20px; top: 20%; transform: rotate(-9deg); }
.card__gift--right { right: -20px; top: 56%; transform: rotate(8deg); }
/* La hoja por delante: si no, los objetos se le montan encima al texto */
.sheet { z-index: 1; }

.sheet__outro {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 279px;
  margin: 26px auto 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}
.sheet__outro-rest {
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 176px;
  height: 24px;
  transform: translateX(-50%);
  border-radius: 50%;
  filter: blur(10px);
  background: ${withAlpha(palette.text, 0.18)};
}
.sheet__outro-gift {
  position: relative;
  filter: drop-shadow(0 9px 11px ${withAlpha(palette.text, 0.3)});
}
.sheet__outro-gift--a { transform: rotate(-6deg); }
.sheet__outro-gift--b { transform: rotate(7deg); }
.sheet__outro-motif { position: relative; margin-bottom: 20px; opacity: 0.7; line-height: 0; }
.sheet__outro-orn { position: relative; z-index: 1; display: block; opacity: 0.7; }
.sheet__outro-orn .card__ornament { margin: 12px auto 0; }

@media (prefers-reduced-motion: reduce) {
  .ambient *,
  .stage__heart,
  .envelope__seal-inner,
  .envelope__hint { animation: none; }
}

/* ----------------------------------------------------------------------
 * Los momentos entre el sobre y la carta.
 *
 * Estas tres hojas son LAS MISMAS que usa la app: se importan de
 * utils/bloomArt, utils/phraseLayout y utils/memoriesLayout. Si una animación
 * cambia allá, el archivo descargado cambia con ella.
 * ------------------------------------------------------------------- */
${BLOOM_CSS}
${PHRASE_CSS}
${MEM_CSS}
`;
};
