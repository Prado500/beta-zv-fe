import { withAlpha } from './themePalette';

/**
 * Carácter decorativo de cada tema.
 *
 * Los ocho temas compartían exactamente la misma hoja y solo cambiaban de
 * color, por eso la carta se sentía plana. Aquí cada uno gana su motivo, su
 * metal, la trama de su papel y el filo del borde — las cuatro cosas que hacen
 * que una papelería se reconozca sin leer el nombre del estilo.
 */

export type Motif =
  | 'heart'
  | 'petals'
  | 'star'
  | 'sun'
  | 'sparkle'
  | 'leaf'
  | 'moon'
  | 'butterfly';

export type Texture = 'dots' | 'weave' | 'stardust' | 'diagonal' | 'grid' | 'ruled';

export type Edge = 'double' | 'dashed' | 'plain';

export interface ThemeDecor {
  motif: Motif;
  /** Color del filete y las filigranas: dorado, plata, cobre… */
  metal: string;
  texture: Texture;
  edge: Edge;
}

export const THEME_DECOR: Record<string, ThemeDecor> = {
  classic: { motif: 'heart', metal: '#D4AF37', texture: 'dots', edge: 'double' },
  pastelPink: { motif: 'petals', metal: '#E0A899', texture: 'weave', edge: 'dashed' },
  starry: { motif: 'star', metal: '#C7CBD4', texture: 'stardust', edge: 'double' },
  sunset: { motif: 'sun', metal: '#C98A4B', texture: 'diagonal', edge: 'plain' },
  lavender: { motif: 'sparkle', metal: '#B9A7D6', texture: 'stardust', edge: 'dashed' },
  emerald: { motif: 'leaf', metal: '#9BAE7F', texture: 'grid', edge: 'double' },
  midnight: { motif: 'moon', metal: '#9FB2C4', texture: 'stardust', edge: 'plain' },
  vintage: { motif: 'butterfly', metal: '#B08653', texture: 'ruled', edge: 'double' },
};

export const decorFor = (themeId: string): ThemeDecor => THEME_DECOR[themeId] ?? THEME_DECOR.classic;

/* ---------- Motivos ---------- */

/**
 * Trazados en una caja de 48×48. Se usan en el sello de la carta, en el centro
 * de la filigrana y en el corazón del código QR.
 */
export const MOTIF_PATHS: Record<Motif, string> = {
  heart:
    '<path d="M24 41C13.2 33.4 8 28.7 8 22.4 8 17.2 12.1 13 17.2 13c2.9 0 5.6 1.4 7.3 3.6C26.2 14.4 28.9 13 31.8 13 36.9 13 41 17.2 41 22.4 41 28.7 35.8 33.4 24 41Z"/>',
  petals:
    '<path d="M24 6c4 0 7 3.4 7 7.6 0 1.3-.3 2.5-.8 3.6 1-.6 2.2-1 3.5-1 4 0 7.3 3.4 7.3 7.6S37.7 31.4 33.7 31.4c-1.3 0-2.5-.4-3.5-1 .5 1.1.8 2.3.8 3.6C31 38.2 28 41.6 24 41.6s-7-3.4-7-7.6c0-1.3.3-2.5.8-3.6-1 .6-2.2 1-3.5 1-4 0-7.3-3.4-7.3-7.6s3.3-7.6 7.3-7.6c1.3 0 2.5.4 3.5 1-.5-1.1-.8-2.3-.8-3.6C17 9.4 20 6 24 6Z"/>',
  star:
    '<path d="M24 6l4.9 12.3L42 20.4l-9.5 8.9 2.5 13.1L24 36.1l-11 6.3 2.5-13.1L6 20.4l13.1-2.1Z"/>',
  sun: '<circle cx="24" cy="24" r="10"/><path d="M24 4v5M24 39v5M4 24h5M39 24h5M10 10l3.5 3.5M34.5 34.5 38 38M38 10l-3.5 3.5M13.5 34.5 10 38" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  sparkle:
    '<path d="M24 5c1.6 8.6 4.4 11.4 13 13-8.6 1.6-11.4 4.4-13 13-1.6-8.6-4.4-11.4-13-13 8.6-1.6 11.4-4.4 13-13Z"/><path d="M36.5 30c.8 4.3 2.2 5.7 6.5 6.5-4.3.8-5.7 2.2-6.5 6.5-.8-4.3-2.2-5.7-6.5-6.5 4.3-.8 5.7-2.2 6.5-6.5Z"/>',
  leaf: '<path d="M39 9C20 11 10 20 10 31c0 3 .8 5.6 2.2 7.6C16 30 23 23.5 33 20.5 24 25 17 32 14.5 41.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  moon: '<path d="M34 10 C26 12 20 18 20 24 C20 30 26 36 34 38 C24 40 14 33 14 24 C14 15 24 8 34 10 Z"/>',
  butterfly:
    '<path d="M24 24c-3-5-10-7-14-2 0 5.5 3.6 10.6 8.9 10.6 3.5 0 5.1-3.4 5.1-8.6Zm0 0c3-5 10-7 14-2 0 5.5-3.6 10.6-8.9 10.6-3.5 0-5.1-3.4-5.1-8.6Z"/><path d="M24 21.5c-.7-4-2-7.5-3.6-9.5 2.4-.6 3.6.9 3.6 9.5Zm0 0c.7-4 2-7.5 3.6-9.5-2.4-.6-3.6.9-3.6 9.5Z"/>',
};

/**
 * Caja cuadrada ajustada a cada trazado: [x, y, lado].
 *
 * Con el cuadro común de 48 cada trazado caía donde caía: la hoja y la mariposa
 * ocupaban poco más de la mitad y se veían diminutas, el corazón quedaba bajo.
 * En el lacre, que es un círculo, el descuadre canta. Estas cajas salen de
 * medir los extremos reales de cada trazado, con 2 de holgura para el trazo.
 */
export const MOTIF_BOX: Record<Motif, [number, number, number]> = {
  heart: [6, 8.5, 37],
  petals: [4.2, 4, 39.6],
  star: [3.8, 4, 40.4],
  sun: [2, 2, 44],
  sparkle: [6, 3, 42],
  leaf: [6.25, 7, 36.5],
  moon: [7.66, 7.66, 32.68],
  butterfly: [8, 6.24, 32],
};

/** `viewBox` propio del motivo. */
export const motifViewBox = (motif: Motif): string => {
  const [x, y, size] = MOTIF_BOX[motif];
  return `${x} ${y} ${size} ${size}`;
};

/**
 * Transformación que coloca el motivo centrado en (cx, cy) con el lado pedido,
 * para incrustarlo dentro de un SVG con otro sistema de coordenadas.
 */
export const motifTransform = (motif: Motif, size: number, cx: number, cy: number): string => {
  const [x, y, box] = MOTIF_BOX[motif];
  const scale = size / box;
  const tx = cx - size / 2 - x * scale;
  const ty = cy - size / 2 - y * scale;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`;
};

/** Los motivos de trazo se dibujan con stroke; el resto van rellenos. */
export const isStrokedMotif = (motif: Motif): boolean => motif === 'leaf';

/** SVG suelto del motivo, listo para incrustar. */
export const motifSvg = (motif: Motif, size: number, color: string): string =>
  `<svg viewBox="${motifViewBox(motif)}" width="${size}" height="${size}" fill="${
    isStrokedMotif(motif) ? 'none' : color
  }" color="${color}" aria-hidden="true">${MOTIF_PATHS[motif]}</svg>`;

/* ---------- Trama del papel ---------- */

export interface TextureCss {
  backgroundImage: string;
  backgroundSize: string;
  opacity: number;
}

/** Trama de fondo de la hoja, derivada del color de texto del tema. */
export const textureCss = (texture: Texture, ink: string): TextureCss => {
  const soft = withAlpha(ink, 0.07);
  const faint = withAlpha(ink, 0.05);

  switch (texture) {
    case 'weave':
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${faint} 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, ${faint} 0 1px, transparent 1px 6px)`,
        backgroundSize: 'auto',
        opacity: 0.5,
      };
    case 'stardust':
      return {
        backgroundImage: `radial-gradient(${soft} 0.7px, transparent 0.7px), radial-gradient(${faint} 0.5px, transparent 0.5px)`,
        backgroundSize: '23px 23px, 13px 13px',
        opacity: 0.65,
      };
    case 'diagonal':
      return {
        backgroundImage: `repeating-linear-gradient(115deg, ${faint} 0 1px, transparent 1px 9px)`,
        backgroundSize: 'auto',
        opacity: 0.5,
      };
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${faint} 1px, transparent 1px), linear-gradient(90deg, ${faint} 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
        opacity: 0.45,
      };
    case 'ruled':
      return {
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0 21px, ${faint} 21px 22px)`,
        backgroundSize: 'auto',
        opacity: 0.7,
      };
    case 'dots':
    default:
      return {
        backgroundImage: `radial-gradient(${soft} 0.5px, transparent 0.5px)`,
        backgroundSize: '11px 11px',
        opacity: 0.4,
      };
  }
};

export interface EdgeCss {
  border: string;
  boxShadow?: string;
}

/** Filo interior de la hoja: doble filete, punteado o nada. */
export const edgeCss = (edge: Edge, metal: string): EdgeCss | null => {
  if (edge === 'plain') return null;
  return {
    border:
      edge === 'dashed'
        ? `1px dashed ${withAlpha(metal, 0.55)}`
        : `1px solid ${withAlpha(metal, 0.5)}`,
    boxShadow: edge === 'double' ? `inset 0 0 0 3px ${withAlpha(metal, 0.16)}` : undefined,
  };
};
