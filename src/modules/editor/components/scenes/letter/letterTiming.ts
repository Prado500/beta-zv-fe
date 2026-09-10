/**
 * Tiempos y medidas de la escena de la carta, en un solo sitio.
 *
 * Los comparten la hoja de estilos —que los interpola en sus animaciones— y
 * los componentes que programan temporizadores: si la firma tarda 1600 ms en
 * escribirse, el relleno y el aviso de "firmada" tienen que contar con esa
 * misma cifra. Escritos dos veces, divergirían.
 */

/** Lo que tarda la firma en trazarse. */
export const SIGN_MS = 1600;
/** Cuándo empieza a aparecer el relleno de la firma, contado desde el trazo. */
export const SIGN_FILL_AT_MS = 1350;
export const SIGN_FILL_MS = 500;

/** Cuánto hay que mantener presionado el lacre para sellar. */
export const HOLD_MS = 1200;

/** Escalonado entre bloques que entran a la vez, y su tope. */
export const REVEAL_STAGGER_MS = 90;
export const REVEAL_MAX_DELAY_MS = 540;

/** Radio y perímetro del anillo que se llena al mantener presionado. */
export const RING_R = 38;
export const RING_C = 2 * Math.PI * RING_R;

/** En demo, cuánto espera desde que la firma termina antes de sellar solo. */
export const AUTO_SEAL_DELAY_MS = 1400;

/** Velocidad del desplazamiento automático en modo demo, en px por segundo. */
export const AUTO_SCROLL_PX_S = 90;
export const AUTO_SCROLL_START_MS = 2000;
