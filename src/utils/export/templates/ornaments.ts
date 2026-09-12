/**
 * Decoración vectorial compartida por el documento exportado: la misma
 * filigrana, rosa y corazones que usan el promo y el editor, escritos como
 * SVG en línea para que el archivo siga siendo autocontenido.
 */

/** PRNG determinista: el mismo reparto de corazones en cada apertura. */
const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

import { MOTIF_PATHS, isStrokedMotif, motifTransform, type Motif } from '../../themeDecor';

const HEART_PATH =
  'M12 21 C5.4 16.2 2 13.2 2 9.2 C2 6 4.5 3.5 7.6 3.5 C9.4 3.5 11.1 4.4 12 5.8 C12.9 4.4 14.6 3.5 16.4 3.5 C19.5 3.5 22 6 22 9.2 C22 13.2 18.6 16.2 12 21 Z';

/** Filigrana horizontal con corazón al centro. */
let ornamentSeq = 0;

export const ornament = (color: string, width = 180, motif: Motif = 'heart'): string => {
  const uid = `orn${++ornamentSeq}`;
  const lid = `${uid}-l`;
  const rid = `${uid}-r`;

  return `
<svg class="card__ornament" viewBox="0 0 240 18" width="${width}" height="${Math.round(
  (width / 240) * 18,
)}" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${lid}" gradientUnits="userSpaceOnUse" x1="4" y1="9" x2="96" y2="9">
      <stop offset="0" stop-color="${color}" stop-opacity="0"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0.75"/>
    </linearGradient>
    <linearGradient id="${rid}" gradientUnits="userSpaceOnUse" x1="144" y1="9" x2="236" y2="9">
      <stop offset="0" stop-color="${color}" stop-opacity="0.75"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M4 9 H96" stroke="url(#${lid})" stroke-width="1" stroke-linecap="round"/>
  <path d="M144 9 H236" stroke="url(#${rid})" stroke-width="1" stroke-linecap="round"/>
  <circle cx="101" cy="9" r="1.1" fill="${color}" fill-opacity="0.55"/>
  <circle cx="139" cy="9" r="1.1" fill="${color}" fill-opacity="0.55"/>
  <path d="M106 9 C106 4.8 108.7 2.6 112 2.6 C112 6.6 109.4 9 106 9 Z" stroke="${color}" stroke-opacity="0.5" stroke-width="0.9" stroke-linejoin="round"/>
  <path d="M134 9 C134 13.2 131.3 15.4 128 15.4 C128 11.4 130.6 9 134 9 Z" stroke="${color}" stroke-opacity="0.5" stroke-width="0.9" stroke-linejoin="round"/>
  <g transform="${motifTransform(motif, 13, 120, 9)}" fill="${
    isStrokedMotif(motif) ? 'none' : color
  }" stroke="${isStrokedMotif(motif) ? color : 'none'}" color="${color}">${MOTIF_PATHS[motif]}</g>
</svg>`;
};

/** Rosa en espiral con tallo y hojas, para las esquinas del escenario. */
export const rose = (color: string, leaf: string, size: number, extraClass: string): string => `
<svg class="stage__rose ${extraClass}" viewBox="0 0 120 200" width="${size}" height="${Math.round(
  (size / 120) * 200,
)}" fill="none" aria-hidden="true">
  <path d="M60 78 C63 118 61 152 57 192" stroke="${leaf}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M61 118 C78 110 92 116 99 128 C84 138 68 134 61 118 Z" fill="${leaf}" fill-opacity="0.85"/>
  <path d="M59 146 C42 140 28 147 22 160 C38 168 53 162 59 146 Z" fill="${leaf}" fill-opacity="0.7"/>
  <path d="M60 80 C50 78 44 70 43 60 C52 64 58 71 60 80 Z" fill="${leaf}" fill-opacity="0.9"/>
  <path d="M60 80 C70 78 76 70 77 60 C68 64 62 71 60 80 Z" fill="${leaf}" fill-opacity="0.9"/>
  <path d="M60 12 C88 12 106 32 106 54 C106 72 86 84 60 84 C34 84 14 72 14 54 C14 32 32 12 60 12 Z" fill="${color}"/>
  <path d="M60 28 C76 28 87 40 87 52 C87 63 75 71 60 71 C45 71 33 63 33 52 C33 40 44 28 60 28 Z" fill="#000000" fill-opacity="0.12"/>
  <path d="M75 52 C75 44 68 38 60 38 C51 38 45 45 45 53 C45 60 51 65 58 65 C64 65 68 61 68 55 C68 50 64 47 60 47 C57 47 54 50 54 53" stroke="#ffffff" stroke-opacity="0.42" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

/** Corazones regados por el escenario de escritorio. */
export const heartConfetti = (count: number): string => {
  const rand = seeded(count * 7919 + 104729);
  return Array.from({ length: count }, () => {
    const left = rand() * 96 + 2;
    const top = rand() * 92 + 4;
    const size = 10 + rand() * 16;
    const rotate = rand() * 70 - 35;
    const alpha = (0.35 + rand() * 0.5).toFixed(2);
    const outline = rand() > 0.6;
    const delay = (rand() * 6).toFixed(2);
    const duration = (6 + rand() * 5).toFixed(2);

    return `<svg class="stage__heart" viewBox="0 0 24 24" width="${size.toFixed(
      0,
    )}" height="${size.toFixed(
      0,
    )}" style="left: ${left.toFixed(1)}%; top: ${top.toFixed(1)}%; transform: rotate(${rotate.toFixed(
      1,
    )}deg); opacity: ${alpha}; animation-delay: ${delay}s; animation-duration: ${duration}s;" aria-hidden="true"><path d="${HEART_PATH}" fill="${
      outline ? 'none' : 'currentColor'
    }" stroke="${outline ? 'currentColor' : 'none'}" stroke-width="${
      outline ? 1.8 : 0
    }" stroke-linejoin="round"/></svg>`;
  }).join('');
};

/** Los glifos que se pintan macizos; el resto van a puro trazo. */
const FILLED_ICONS = new Set(['heart', 'play', 'pause']);

export type IconName =
  | 'heart'
  | 'lock'
  | 'note'
  | 'headphones'
  | 'close'
  | 'left'
  | 'right'
  | 'play'
  | 'pause'
  | 'equalizer'
  | 'noteOff'
  | 'openOut';

/** Icono de trazo, para los pocos glifos de interfaz de la carta. */
export const icon = (name: IconName, size = 16): string => {
  const paths: Record<string, string> = {
    heart: `<path d="${HEART_PATH}" fill="currentColor"/>`,
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    note: '<circle cx="7" cy="18" r="3"/><path d="M10 18V5l10-2v13"/><circle cx="17" cy="16" r="3"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    play: '<path d="M8 5.2v13.6L19 12z" fill="currentColor"/>',
    pause: '<rect x="7" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/>',
    equalizer: '<path d="M6 14v6M12 4v16M18 10v10"/>',
    /* Nota tachada: la canción existe, pero su dueño no deja que suene aquí */
    noteOff: '<circle cx="7" cy="18" r="3"/><path d="M10 18V5l10-2v6"/><path d="M4 4l16 16"/>',
    openOut: '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  };
  const filled = FILLED_ICONS.has(name);
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${
    filled ? 'none' : 'currentColor'
  }" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};

/** Enredadera de esquina, la misma del resto del producto. */
export const cornerFlourish = (
  color: string,
  size: number,
  corner: 'tl' | 'tr' | 'bl' | 'br',
): string => {
  const angle = { tl: 0, tr: 90, br: 180, bl: 270 }[corner];
  const rotate = angle ? ` transform="rotate(${angle} 32 32)"` : '';
  return `<svg class="sheet__corner sheet__corner--${corner}" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" aria-hidden="true"><g${rotate}><path d="M2 40 C2 19 19 2 40 2" stroke="${color}" stroke-opacity="0.55" stroke-width="1" stroke-linecap="round"/><path d="M9 40 C9 23 23 9 40 9" stroke="${color}" stroke-opacity="0.3" stroke-width="0.9" stroke-linecap="round"/><path d="M20 14 C24 9 30 8 34 9 C31 14 25 16 20 14 Z" stroke="${color}" stroke-opacity="0.45" stroke-width="0.9" stroke-linejoin="round"/><circle cx="40" cy="2" r="1.4" fill="${color}" fill-opacity="0.5"/><circle cx="2" cy="40" r="1.4" fill="${color}" fill-opacity="0.5"/></g></svg>`;
};
