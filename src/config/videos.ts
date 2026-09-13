/**
 * Vídeos de YouTube de la página promocional.
 *
 * Viven aquí y no escritos en cada sección: antes había `TU_VIDEO_ID_1`…`_6` y
 * `TU_VIDEO_ID_R1`…`R3` repartidos por seis componentes, y YouTube respondía
 * "An error occurred" en todos. Con un solo archivo, cambiar un vídeo es
 * cambiar una línea, y un ID inválido no puede quedarse escondido en un JSX.
 *
 * Ya están todos los definitivos. Cuidado al probar: los vídeos musicales con licencia de sello
 * devuelven error 150 si la página se sirve desde una IP (127.0.0.1 o la IP de
 * la LAN); desde `localhost` o el dominio real reproducen.
 */

/** Vídeo real y embebible: Ed Sheeran – Perfect. */
export const DEFAULT_VIDEO_ID = '2Vv-BfVoq4g';

export const LANDING_VIDEOS = {
  /** Vídeo 1 - Hero: el gancho dentro del teléfono. */
  hook: 'xUKoisOLr-A',
  /** Vídeo 2 - Sección "Origen". */
  origin: 'wAqowOnCbmo',
  /** Vídeo 3 - Demostración sobre el editor en vivo. */
  demo: 'VUZ0Hdj6IHw',
  /** Vídeo 4 - Reacciones en grupo, en la prueba social. */
  validation: 'Vqk8Zylyfxc',
  /** Vídeo 5 - Sección de características. */
  features: 'B8sgIHmuBYc',
  /** Vídeo 6 - Cierre junto al precio. */
  closing: 'RF9ULRocwPY',
} as const;

/** Una reacción por testimonio, por su `id`. Son los cortos de Instagram. */
export const REACTION_VIDEOS = {
  /** Reacción 1 */
  qa: 'H9a6-Ron3ac',
  /** Reacción 2 */
  andrea: 'd79INXy2POU',
  /** Reacción 3 */
  sofia: 'ipQ9WbfUJUg',
} as const;

/** Canción de la demo de la landing: la que "viene puesta" en el teléfono. */
export const DEMO_SONG = {
  videoId: DEFAULT_VIDEO_ID,
  title: 'Perfect',
  artist: 'Ed Sheeran',
} as const;
