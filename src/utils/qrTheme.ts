import { THEME_PRESETS } from '../modules/editor/types';
import { darkenUntilContrast, relativeLuminance, resolvePalette, withAlpha } from './themePalette';
import { MOTIF_PATHS, decorFor, isStrokedMotif, motifTransform } from './themeDecor';

/** Contraste mínimo entre módulos y fondo. Por debajo, muchos lectores fallan. */
export const MIN_QR_CONTRAST = 7;

export interface QrPalette {
  fg: string;
  bg: string;
  frame: string;
  ink: string;
  /** true si hubo que oscurecer el acento para llegar al contraste mínimo. */
  adjusted: boolean;
}

/**
 * Deriva los colores del QR a partir del tema.
 *
 * Los temas oscuros (Noche Estrellada, Medianoche Azul) NO se mapean tal cual:
 * un QR claro sobre fondo oscuro queda invertido y buena parte de los lectores
 * lo rechaza. Para esos se usa fondo blanco. Y como acentos tipo el dorado
 * #fbbf24 apenas dan 1.7:1 contra un fondo claro, el color se oscurece
 * conservando su tono hasta cumplir el mínimo: sigue leyéndose como el dorado
 * del tema, pero escanea.
 */
export const buildQrPalette = (themeId: string): QrPalette => {
  const theme = THEME_PRESETS[themeId] || THEME_PRESETS.classic;
  const palette = resolvePalette(theme);

  const bg = palette.isDark ? '#ffffff' : palette.bg;
  const raw = relativeLuminance(palette.accent) > 0.6 ? palette.text : palette.accent;
  const fg = darkenUntilContrast(raw, bg, MIN_QR_CONTRAST);

  return {
    fg,
    bg,
    frame: palette.isDark ? withAlpha(palette.accent, 0.45) : palette.border,
    ink: palette.isDark ? '#1f2937' : palette.text,
    adjusted: fg.toLowerCase() !== raw.toLowerCase(),
  };
};

/* ---------- Icono central ---------- */

/**
 * SVG del motivo del tema como data URI, para el centro del QR.
 *
 * Se dibuja en vez de usar emoji (❤️, 🌸, ⭐): el emoji depende de la fuente
 * del sistema y no se rasteriza de forma fiable al exportar el canvas a PNG.
 * Los trazados son los mismos que usan el lacre y la filigrana de la carta.
 */
export const buildCenterIcon = (themeId: string, color: string, background: string): string => {
  const motif = decorFor(themeId).motif;
  const stroked = isStrokedMotif(motif);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48" color="${color}">
    <rect width="48" height="48" rx="12" fill="${background}"/>
    <g transform="${motifTransform(motif, 30, 24, 24)}" fill="${
      stroked ? 'none' : color
    }" stroke="${stroked ? color : 'none'}" stroke-width="${
      stroked ? 3 : 0
    }" stroke-linecap="round" stroke-linejoin="round">${MOTIF_PATHS[motif]}</g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/* ---------- Emblema alado de la postal ---------- */

/** Proporción del emblema alado: más ancho que alto. */
export const CENTER_ICON_RATIO = 72 / 128;

/**
 * SVG del emblema alado para el centro del QR de la postal, como data URI.
 *
 * Las alas van en el metal del tema y el motivo en el color del QR. Ocupan
 * una franja apaisada, no un cuadrado: son ~4,5% del área del código, muy por
 * debajo del ~30% que tolera la corrección de errores en nivel H. Quien lo
 * pinte debe darle un alto de `width * CENTER_ICON_RATIO`.
 *
 * Convive con `buildCenterIcon`, que sigue siendo cuadrado: el editor y el
 * modal de Mis Dedicatorias lo dibujan a lado fijo y un emblema apaisado ahí
 * saldría aplastado. Cuando esas pantallas adopten la postal, el cuadrado
 * se retirará.
 */
export const buildWingedCenterIcon = (
  themeId: string,
  color: string,
  background: string,
  metal?: string,
): string => {
  const decor = decorFor(themeId);
  const motif = decor.motif;
  const stroked = isStrokedMotif(motif);
  const wing = metal ?? decor.metal;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="144" viewBox="0 0 128 72" color="${color}">
    <rect width="128" height="72" rx="16" fill="${background}"/>
    <g fill="${wing}">
      <path d="M52 36 C44 26 34 20 22 17 C26 23 31 27 38 30 C28 30 19 27 10 22 C13 29 20 35 30 37 C21 39 14 43 9 49 C22 50 38 45 52 38 Z"/>
      <path d="M76 36 C84 26 94 20 106 17 C102 23 97 27 90 30 C100 30 109 27 118 22 C115 29 108 35 98 37 C107 39 114 43 119 49 C106 50 90 45 76 38 Z"/>
    </g>
    <g fill="#ffffff" fill-opacity="0.3">
      <path d="M52 36 C44 29 34 25 24 23 C29 27 36 31 44 33 Z"/>
      <path d="M76 36 C84 29 94 25 104 23 C99 27 92 31 84 33 Z"/>
    </g>
    <g transform="${motifTransform(motif, 32, 64, 35)}" fill="${
      stroked ? 'none' : color
    }" stroke="${stroked ? color : 'none'}" stroke-width="${
      stroked ? 3 : 0
    }" stroke-linecap="round" stroke-linejoin="round">${MOTIF_PATHS[motif]}</g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
