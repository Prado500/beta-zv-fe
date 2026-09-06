import { MOTIF_PATHS, isStrokedMotif, motifTransform, type Motif } from './themeDecor';

/**
 * Los objetos que acompañan a la carta: ramo, bombones, copas, velas…
 *
 * Van dibujados como SVG y no como fotografías a propósito. Una foto trae su
 * propia luz y su propio color, y aquí el mismo objeto tiene que convivir con
 * ocho paletas distintas — el ramo del tema medianoche no puede verse igual
 * que el del clásico. Cada dibujo recibe los colores del tema y se tiñe solo.
 * Además el documento exportado se lleva todo dentro: una foto suma cientos de
 * kilobytes en base64, y con el cupo del navegador ya tuvimos ese problema.
 *
 * Todos comparten el cuadro 0 0 100 100 con el objeto entre 6 y 94, para que
 * pedir 80px de lado dé el mismo peso visual sea cual sea el objeto.
 */

export type Gift =
  | 'bouquet'
  | 'chocolates'
  | 'giftbox'
  | 'candle'
  | 'glasses'
  | 'ring'
  | 'teddy'
  | 'lantern'
  | 'letters';

export interface GiftPaint {
  /** Color principal del tema. */
  accent: string;
  /** Filete: dorado, plata, cobre… el mismo de las filigranas. */
  metal: string;
  /** Tinta del tema, para sombras y rasgos. */
  ink: string;
  /** Papel del tema, para volúmenes claros y brillos. */
  paper: string;
  /** Símbolo del tema: aparece en el lacre y en la panza del oso. */
  motif: Motif;
}

/** Una flor de cinco pétalos centrada en (cx, cy). */
const blossom = (cx: number, cy: number, r: number, fill: string, core: string): string => {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = ((i * 72 - 90) * Math.PI) / 180;
    return `<circle cx="${(cx + Math.cos(a) * r * 0.6).toFixed(1)}" cy="${(
      cy +
      Math.sin(a) * r * 0.6
    ).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="${fill}"/>`;
  }).join('');
  return `${petals}<circle cx="${cx}" cy="${cy}" r="${(r * 0.28).toFixed(1)}" fill="${core}"/>`;
};

/** Motivo del tema incrustado en el cuadro de 100. */
const badge = (motif: Motif, size: number, cx: number, cy: number, color: string): string =>
  `<g transform="${motifTransform(motif, size, cx, cy)}" fill="${
    isStrokedMotif(motif) ? 'none' : color
  }" stroke="${isStrokedMotif(motif) ? color : 'none'}" stroke-width="3" color="${color}">${
    MOTIF_PATHS[motif]
  }</g>`;

/**
 * Lazo de dos bucles con nudo y colas, apoyado en (cx, cy).
 *
 * Los bucles van bien abiertos: con la primera versión, más plana, a 60px de
 * lado el lazo se leía como un triángulo suelto y no como un lazo.
 */
const bow = (cx: number, cy: number, w: number, accent: string, metal: string): string => {
  const n = (v: number) => v.toFixed(1);
  return `
<path d="M${cx} ${cy} L${n(cx - w * 0.58)} ${n(cy + w * 1.1)} L${n(cx - w * 0.14)} ${n(
    cy + w * 0.92,
  )} Z" fill="${accent}" fill-opacity="0.7"/>
<path d="M${cx} ${cy} L${n(cx + w * 0.58)} ${n(cy + w * 1.1)} L${n(cx + w * 0.14)} ${n(
    cy + w * 0.92,
  )} Z" fill="${accent}" fill-opacity="0.7"/>
<path d="M${cx} ${cy} C${n(cx - w * 0.1)} ${n(cy - w)} ${n(cx - w * 0.9)} ${n(
    cy - w * 1.15,
  )} ${n(cx - w * 1.05)} ${n(cy - w * 0.45)} C${n(cx - w * 1.15)} ${n(cy + w * 0.05)} ${n(
    cx - w * 0.5,
  )} ${n(cy + w * 0.15)} ${cx} ${cy} Z" fill="${accent}" fill-opacity="0.9"/>
<path d="M${cx} ${cy} C${n(cx + w * 0.1)} ${n(cy - w)} ${n(cx + w * 0.9)} ${n(
    cy - w * 1.15,
  )} ${n(cx + w * 1.05)} ${n(cy - w * 0.45)} C${n(cx + w * 1.15)} ${n(cy + w * 0.05)} ${n(
    cx + w * 0.5,
  )} ${n(cy + w * 0.15)} ${cx} ${cy} Z" fill="${accent}" fill-opacity="0.9"/>
<circle cx="${cx}" cy="${cy}" r="${n(w * 0.28)}" fill="${metal}"/>`;
};

export const GIFT_ART: Record<Gift, (p: GiftPaint) => string> = {
  /*
   * Ramo envuelto en papel, con lazo al cuello.
   *
   * El papel es un cono con la punta abajo y el borde superior hundido en el
   * centro: la primera versión lo tenía en pico hacia arriba y el ramo parecía
   * un sobre puesto del revés.
   */
  bouquet: ({ accent, metal, ink, paper }) => `
<path d="M34 52 C26 46 20 47 16 53 C24 59 31 58 34 52 Z" fill="${metal}" fill-opacity="0.5"/>
<path d="M66 52 C74 46 80 47 84 53 C76 59 69 58 66 52 Z" fill="${metal}" fill-opacity="0.5"/>
${blossom(50, 20, 15, accent, metal)}
${blossom(27, 31, 13, accent, metal)}
${blossom(73, 31, 13, accent, metal)}
${blossom(37, 47, 12, accent, metal)}
${blossom(63, 47, 12, accent, metal)}
<path d="M10 53 C24 66 76 66 90 53 L62 94 H38 Z" fill="${paper}" stroke="${metal}" stroke-width="2" stroke-linejoin="round"/>
<path d="M50 63 V94" stroke="${ink}" stroke-opacity="0.07" stroke-width="7"/>
<path d="M28 60 L38 94" stroke="${ink}" stroke-opacity="0.05" stroke-width="5"/>
${bow(50, 74, 10, accent, metal)}`,

  /* Caja de bombones abierta: la tapa reposa detrás. */
  chocolates: ({ accent, metal, ink, paper, motif }) => {
    const pieces = [
      [34, 62],
      [50, 62],
      [66, 62],
      [34, 78],
      [50, 78],
      [66, 78],
    ]
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="7" fill="${ink}" fill-opacity="0.55"/><path d="M${
            x - 3.4
          } ${y + 1.6} C${x - 2} ${y - 2.4} ${x + 2} ${y - 2.4} ${x + 3.4} ${
            y + 1.6
          }" fill="none" stroke="${paper}" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round"/>`,
      )
      .join('');

    return `
<g transform="rotate(-13 26 36)">
  <rect x="7" y="19" width="44" height="32" rx="5" fill="${paper}" stroke="${metal}" stroke-width="2"/>
  <path d="M29 19 V51" stroke="${accent}" stroke-opacity="0.55" stroke-width="5"/>
  ${badge(motif, 13, 29, 34, accent)}
</g>
<rect x="18" y="50" width="68" height="42" rx="7" fill="${paper}" stroke="${metal}" stroke-width="2.2"/>
<rect x="23" y="55" width="58" height="32" rx="4" fill="${accent}" fill-opacity="0.1"/>
${pieces}`;
  },

  /* Caja de regalo con lazo. */
  giftbox: ({ accent, metal, ink, paper }) => `
<rect x="17" y="44" width="66" height="48" rx="6" fill="${paper}" stroke="${metal}" stroke-width="2.2"/>
<path d="M17 60 H83" stroke="${ink}" stroke-opacity="0.08" stroke-width="8"/>
<rect x="11" y="32" width="78" height="16" rx="5" fill="${paper}" stroke="${metal}" stroke-width="2.2"/>
<path d="M50 34 V92" stroke="${accent}" stroke-opacity="0.8" stroke-width="9"/>
<path d="M50 34 V92" stroke="${metal}" stroke-opacity="0.5" stroke-width="1.2"/>
${bow(50, 33, 14, accent, metal)}`,

  /* Vela encendida en su portavelas. */
  candle: ({ accent, metal, ink, paper }) => `
<circle cx="50" cy="24" r="21" fill="${accent}" fill-opacity="0.14"/>
<path d="M50 6 C60 19 64 26 64 32 C64 40 57 46 50 46 C43 46 36 40 36 32 C36 26 40 19 50 6 Z" fill="${accent}" fill-opacity="0.9"/>
<path d="M50 20 C55 27 57 31 57 34 C57 38 54 41 50 41 C46 41 43 38 43 34 C43 31 45 27 50 20 Z" fill="${paper}" fill-opacity="0.7"/>
<path d="M50 46 V52" stroke="${ink}" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round"/>
<rect x="38" y="50" width="24" height="32" rx="5" fill="${paper}" stroke="${metal}" stroke-width="2"/>
<path d="M38 58 C42 63 46 57 50 62 C54 67 58 59 62 63" fill="none" stroke="${metal}" stroke-opacity="0.45" stroke-width="1.6"/>
<path d="M32 94 H68 L62 80 H38 Z" fill="${paper}" stroke="${metal}" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="50" cy="80" rx="12" ry="3.4" fill="${metal}" fill-opacity="0.4"/>`,

  /* Dos copas brindando. */
  glasses: ({ accent, metal, ink, paper }) => {
    const glass = `
    <path d="M-15 -34 H15 L12 -8 C12 0 7 5 0 5 C-7 5 -12 0 -12 -8 Z" fill="${paper}" fill-opacity="0.55" stroke="${metal}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-13.4 -22 H13.4 L12 -8 C12 0 7 5 0 5 C-7 5 -12 0 -12 -8 Z" fill="${accent}" fill-opacity="0.6"/>
    <path d="M0 5 V26" stroke="${metal}" stroke-width="2.4"/>
    <path d="M-12 28 H12" stroke="${metal}" stroke-width="3" stroke-linecap="round"/>`;
    return `
<ellipse cx="50" cy="90" rx="34" ry="4" fill="${ink}" fill-opacity="0.08"/>
<g transform="translate(33 60) rotate(-13)">${glass}</g>
<g transform="translate(67 60) rotate(13)">${glass}</g>
<path d="M42 20 l3 5 -3 5 -3 -5 Z M58 14 l2.6 4.4 -2.6 4.4 -2.6 -4.4 Z" fill="${metal}" fill-opacity="0.8"/>`;
  },

  /*
   * Cajita de anillo abierta.
   *
   * El aro lleva un halo del color del papel por detrás: sin él se perdía
   * contra la tapa, que es del mismo tono, y solo se leía el diamante.
   */
  ring: ({ accent, metal, ink, paper }) => `
<path d="M25 48 L29 11 H71 L75 48 Z" fill="${paper}" stroke="${metal}" stroke-width="2" stroke-linejoin="round"/>
<path d="M32 43 L35 17 H65 L68 43 Z" fill="${ink}" fill-opacity="0.12"/>
<circle cx="50" cy="50" r="12" fill="none" stroke="${paper}" stroke-width="8"/>
<circle cx="50" cy="50" r="12" fill="none" stroke="${metal}" stroke-width="3.6"/>
<path d="M50 29 l7 8.5 -7 8.5 -7 -8.5 Z" fill="${accent}" fill-opacity="0.9" stroke="${metal}" stroke-width="1.6" stroke-linejoin="round"/>
<rect x="18" y="58" width="64" height="34" rx="6" fill="${paper}" stroke="${metal}" stroke-width="2.2"/>
<path d="M22 66 C32 59 68 59 78 66 L78 61 C68 55 32 55 22 61 Z" fill="${accent}" fill-opacity="0.25"/>
<path d="M18 76 H82" stroke="${ink}" stroke-opacity="0.08" stroke-width="6"/>`,

  /* Osito de peluche con el símbolo del tema en la panza. */
  teddy: ({ accent, metal, ink, paper, motif }) => `
<circle cx="27" cy="27" r="11" fill="${accent}" fill-opacity="0.85"/>
<circle cx="73" cy="27" r="11" fill="${accent}" fill-opacity="0.85"/>
<circle cx="27" cy="27" r="5.4" fill="${paper}" fill-opacity="0.55"/>
<circle cx="73" cy="27" r="5.4" fill="${paper}" fill-opacity="0.55"/>
<ellipse cx="24" cy="66" rx="10" ry="7.5" transform="rotate(-28 24 66)" fill="${accent}" fill-opacity="0.85"/>
<ellipse cx="76" cy="66" rx="10" ry="7.5" transform="rotate(28 76 66)" fill="${accent}" fill-opacity="0.85"/>
<ellipse cx="36" cy="89" rx="10" ry="7.5" fill="${accent}" fill-opacity="0.85"/>
<ellipse cx="64" cy="89" rx="10" ry="7.5" fill="${accent}" fill-opacity="0.85"/>
<ellipse cx="50" cy="70" rx="21" ry="19" fill="${accent}" fill-opacity="0.92"/>
<ellipse cx="50" cy="72" rx="13" ry="11" fill="${paper}" fill-opacity="0.45"/>
${badge(motif, 13, 50, 72, accent)}
<circle cx="50" cy="38" r="20" fill="${accent}" fill-opacity="0.92"/>
<ellipse cx="50" cy="45" rx="9.5" ry="7.5" fill="${paper}" fill-opacity="0.7"/>
<ellipse cx="50" cy="41.5" rx="3.2" ry="2.4" fill="${ink}" fill-opacity="0.75"/>
<path d="M50 44 V47" stroke="${ink}" stroke-opacity="0.5" stroke-width="1.4" stroke-linecap="round"/>
<circle cx="42" cy="34" r="2.3" fill="${ink}" fill-opacity="0.75"/>
<circle cx="58" cy="34" r="2.3" fill="${ink}" fill-opacity="0.75"/>
<path d="M38 22 C42 17 58 17 62 22" fill="none" stroke="${metal}" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>`,

  /* Farol colgante con la luz encendida. */
  lantern: ({ accent, metal, ink, paper }) => `
<path d="M50 4 V12" stroke="${metal}" stroke-width="2" stroke-linecap="round"/>
<circle cx="50" cy="16" r="5" fill="none" stroke="${metal}" stroke-width="2"/>
<circle cx="50" cy="54" r="26" fill="${accent}" fill-opacity="0.13"/>
<path d="M28 26 H72 L65 34 H35 Z" fill="${metal}" fill-opacity="0.55" stroke="${metal}" stroke-width="1.4" stroke-linejoin="round"/>
<rect x="33" y="34" width="34" height="44" rx="4" fill="${paper}" stroke="${metal}" stroke-width="2.2"/>
<rect x="38" y="39" width="24" height="34" rx="3" fill="${accent}" fill-opacity="0.28"/>
<path d="M50 47 C55 53 57 57 57 60 C57 64 54 67 50 67 C46 67 43 64 43 60 C43 57 45 53 50 47 Z" fill="${accent}" fill-opacity="0.9"/>
<path d="M33 78 H67 L73 90 H27 Z" fill="${metal}" fill-opacity="0.5" stroke="${metal}" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M27 90 H73" stroke="${ink}" stroke-opacity="0.12" stroke-width="3"/>`,

  /* Cartas atadas con cinta y lacre. */
  letters: ({ accent, metal, ink, paper, motif }) => `
<g transform="rotate(-8 50 56)">
  <rect x="11" y="30" width="78" height="52" rx="5" fill="${paper}" stroke="${metal}" stroke-width="2"/>
  <path d="M11 34 L50 62 L89 34" fill="none" stroke="${metal}" stroke-opacity="0.45" stroke-width="1.6"/>
</g>
<g transform="rotate(6 50 62)">
  <rect x="14" y="38" width="76" height="50" rx="5" fill="${paper}" stroke="${metal}" stroke-width="2"/>
  <path d="M14 42 L52 68 L90 42" fill="none" stroke="${metal}" stroke-opacity="0.45" stroke-width="1.6"/>
  <path d="M14 88 H90" stroke="${ink}" stroke-opacity="0.08" stroke-width="4"/>
</g>
<path d="M52 26 V94" stroke="${accent}" stroke-opacity="0.75" stroke-width="7"/>
<circle cx="52" cy="60" r="11" fill="${accent}" fill-opacity="0.95" stroke="${metal}" stroke-width="1.8"/>
${badge(motif, 12, 52, 60, paper)}`,
};

/**
 * Dos objetos por tema. Se eligen por lo que evoca cada estilo, no al azar:
 * el ramo y los bombones son el regalo clásico, el farol acompaña a los temas
 * de noche, las copas al atardecer, el oso al más dulce.
 */
export const THEME_GIFTS: Record<string, [Gift, Gift]> = {
  classic: ['bouquet', 'chocolates'],
  pastelPink: ['teddy', 'giftbox'],
  starry: ['lantern', 'glasses'],
  sunset: ['glasses', 'bouquet'],
  lavender: ['candle', 'giftbox'],
  emerald: ['bouquet', 'letters'],
  midnight: ['lantern', 'candle'],
  vintage: ['letters', 'ring'],
};

export const giftsFor = (themeId: string): [Gift, Gift] =>
  THEME_GIFTS[themeId] ?? THEME_GIFTS.classic;

/* ---------- Adornos de la portada ---------- */

/**
 * Guirnalda de flores para colgar sobre el sobre.
 *
 * El arco es una curva de Bézier y las flores van en puntos calculados sobre
 * ella (t = 0,1 · 0,25 · 0,5 · 0,75 · 0,9), no repartidas a ojo: de otro modo
 * las de los extremos se despegaban del tallo.
 */
export const garlandArt = ({ accent, metal, motif }: GiftPaint): string => {
  const leaf = (x: number, y: number, rot: number): string =>
    `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.3" transform="rotate(${rot} ${x} ${y})" fill="${metal}" fill-opacity="0.5"/>`;

  return `
<path d="M10 58 C46 14 194 14 230 58" fill="none" stroke="${metal}" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round"/>
<path d="M15 63 C51 23 189 23 225 63" fill="none" stroke="${metal}" stroke-opacity="0.32" stroke-width="1" stroke-linecap="round"/>
${leaf(37, 39, -36)}${leaf(203, 39, 36)}
${leaf(79, 28, -14)}${leaf(161, 28, 14)}
${blossom(24, 46, 7, accent, metal)}
${blossom(216, 46, 7, accent, metal)}
${blossom(54, 33, 9, accent, metal)}
${blossom(186, 33, 9, accent, metal)}
${blossom(120, 25, 11, accent, metal)}
${badge(motif, 12, 120, 7, accent)}`;
};

export const garlandSvg = (width: number, paint: GiftPaint, className = ''): string =>
  `<svg class="${className}" viewBox="0 0 240 72" width="${width}" height="${Math.round(
    (width / 240) * 72,
  )}" fill="none" aria-hidden="true">${garlandArt(paint)}</svg>`;

export interface DustSpeck {
  /** Posición en % de la pantalla. */
  x: number;
  y: number;
  size: number;
  rot: number;
  alpha: number;
  /** El acento y el metal se alternan para que no quede monótono. */
  tint: 'accent' | 'metal';
}

/**
 * Motivos del tema regados por la portada.
 *
 * Van en posiciones fijas y no al azar: así el reparto es el mismo en la
 * previa y en la descarga, y se puede comprobar que ninguno cae encima del
 * sobre (que ocupa del 11% al 89% de ancho y la franja central de alto).
 */
export const COVER_DUST: DustSpeck[] = [
  { x: 10, y: 7, size: 15, rot: -14, alpha: 0.34, tint: 'metal' },
  { x: 25, y: 13, size: 10, rot: 18, alpha: 0.26, tint: 'accent' },
  { x: 74, y: 5, size: 12, rot: -8, alpha: 0.3, tint: 'accent' },
  { x: 88, y: 11, size: 16, rot: 22, alpha: 0.32, tint: 'metal' },
  { x: 4, y: 44, size: 11, rot: 10, alpha: 0.26, tint: 'accent' },
  { x: 96, y: 52, size: 13, rot: -20, alpha: 0.28, tint: 'metal' },
  { x: 7, y: 88, size: 14, rot: 16, alpha: 0.3, tint: 'accent' },
  { x: 30, y: 95, size: 10, rot: -12, alpha: 0.24, tint: 'metal' },
  { x: 68, y: 93, size: 15, rot: 8, alpha: 0.3, tint: 'metal' },
  { x: 92, y: 86, size: 11, rot: -18, alpha: 0.26, tint: 'accent' },
];

/** SVG suelto del objeto, listo para incrustar en el documento exportado. */
export const giftSvg = (gift: Gift, size: number, paint: GiftPaint, className = ''): string =>
  `<svg class="${className}" viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" aria-hidden="true">${GIFT_ART[gift](
    paint,
  )}</svg>`;
