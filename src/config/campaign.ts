/**
 * Cifras de la campaña.
 *
 * Viven aquí y no escritas a mano en cada sección: la barra superior y el
 * contador de la sección de tendencia muestran el mismo dato, y si se
 * escribieran por separado acabarían diciendo cosas distintas — que es
 * justamente lo que echa por tierra el mensaje de escasez.
 */
export const SPOTS = {
  /** Cupos activados a nivel nacional. */
  total: 10000,
  /** Cupos que quedan libres. */
  remaining: 8364,
} as const;

/** Cupos ya tomados. */
export const spotsTaken = (): number => SPOTS.total - SPOTS.remaining;

/** Proporción ocupada, de 0 a 1. */
export const spotsRatio = (): number => spotsTaken() / SPOTS.total;

/** Miles con punto, como se escriben en Colombia. */
export const formatSpots = (value: number): string => value.toLocaleString('es-CO');
