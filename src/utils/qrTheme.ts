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
