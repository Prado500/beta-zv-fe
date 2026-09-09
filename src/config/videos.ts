/**
 * Vídeos de YouTube de la página promocional.
 *
 * Viven aquí y no escritos en cada sección: antes había `TU_VIDEO_ID_1`…`_6` y
 * `TU_VIDEO_ID_R1`…`R3` repartidos por seis componentes, y YouTube respondía
 * "An error occurred" en todos. Con un solo archivo, cambiar un vídeo es
 * cambiar una línea, y un ID inválido no puede quedarse escondido en un JSX.
 *
 * Mientras llegan los vídeos definitivos, todos apuntan a un vídeo real y
 * embebible. Cuidado al probar: los vídeos musicales con licencia de sello
 * devuelven error 150 si la página se sirve desde una IP (127.0.0.1 o la IP de
 * la LAN); desde `localhost` o el dominio real reproducen.
 */

/** Vídeo real y embebible: Ed Sheeran – Perfect. */
export const DEFAULT_VIDEO_ID = '2Vv-BfVoq4g';

export const LANDING_VIDEOS = {
  /** Hero: el gancho dentro del teléfono. */
  hook: DEFAULT_VIDEO_ID,
  /** Sección "Origen". */
  origin: DEFAULT_VIDEO_ID,
  /** Demostración sobre el editor en vivo. */
  demo: DEFAULT_VIDEO_ID,
  /** Reacciones en grupo, en la prueba social. */
  validation: DEFAULT_VIDEO_ID,
  /** Sección de características. */
  features: DEFAULT_VIDEO_ID,
  /** Cierre junto al precio. */
  closing: DEFAULT_VIDEO_ID,
} as const;

/** Una reacción por testimonio, por su `id`. */
export const REACTION_VIDEOS = {
  qa: DEFAULT_VIDEO_ID,
  andrea: DEFAULT_VIDEO_ID,
  sofia: DEFAULT_VIDEO_ID,
} as const;

/** Canción de la demo de la landing: la que "viene puesta" en el teléfono. */
export const DEMO_SONG = {
  videoId: DEFAULT_VIDEO_ID,
  title: 'Perfect',
  artist: 'Ed Sheeran',
} as const;
