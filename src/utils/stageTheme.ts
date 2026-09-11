import { withAlpha, type ThemePalette } from './themePalette';

/**
 * Los colores del escenario: lo que rodea al teléfono cuando la carta se abre
 * a pantalla completa.
 *
 * No es decoración suelta. Un tema de noche sobre un plano claro se ve como un
 * error, y uno de papel sobre negro pierde todo el calor: el fondo tiene que
 * seguir al tema, y por eso sale de la paleta y no de una constante.
 *
 * Vive aquí porque lo pintan dos sitios que no pueden divergir: el visor
 * público (React) y el HTML que se descarga (`utils/export`). Cuando cada uno
 * tenía su copia, la carta abierta desde el enlace y la abierta desde el
 * archivo no se parecían.
 */
export interface StageColors {
  /** Fondo liso sobre el que se apoya todo lo demás. */
  base: string;
  /** Los dos rubores de luz, en diagonal. */
  glow1: string;
  glow2: string;
  /** Tinta del rótulo "para …", que va suelto sobre el fondo. */
  ink: string;
  /** Corazones flotantes. */
  confetti: string;
}

export const stageColors = (palette: ThemePalette): StageColors =>
  palette.isDark
    ? {
        base: '#0d0a10',
        glow1: withAlpha(palette.accent, 0.18),
        glow2: withAlpha(palette.cardBg, 0.35),
        ink: 'rgba(255,255,255,0.55)',
        confetti: 'rgba(255,255,255,0.5)',
      }
    : {
        base: '#f6efe9',
        glow1: withAlpha(palette.accent, 0.12),
        glow2: withAlpha(palette.border, 0.5),
        ink: 'rgba(94,10,27,0.6)',
        confetti: 'rgba(140,17,40,0.55)',
      };

/** Las dos rosas apoyadas en las esquinas de abajo, teñidas por el tema. */
export const stageRoseColors = (palette: ThemePalette): { petal: string; leaf: string } =>
  palette.isDark
    ? { petal: withAlpha(palette.accent, 0.9), leaf: 'rgba(148,163,184,0.7)' }
    : { petal: '#8c1128', leaf: '#6b7f5c' };
