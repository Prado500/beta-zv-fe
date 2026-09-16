/**
 * Cifras de la campaña.
 *
 * Estas son el **respaldo sin conexión**, no la verdad. La cifra buena la sirve el
 * backend (`GET /api/v1/public/slots`) y baja sola con cada compra pagada; lo que hay
 * aquí es lo que se pinta mientras esa respuesta llega, y lo que se queda si no llega.
 *
 * Que exista un respaldo no es pereza: la landing vive de un mensaje de escasez, y un
 * hueco, un cero o un `NaN` mientras carga lo desmontan más que un número medio viejo.
 * Por eso el valor coincide con el que el contador tenía escrito a mano antes de que
 * fuera real, y por eso la fila del backend nació sembrada en esa misma cifra.
 */
export const SPOTS = {
  /** Cupos activados a nivel nacional. */
  total: 10000,
  /** Cupos que quedan libres. */
  remaining: 8364,
} as const;

/** Cupos ya tomados. */
export const spotsTaken = (total: number, remaining: number): number => total - remaining;

/** Proporción ocupada, de 0 a 1. Sin `total` no hay proporción que valga. */
export const spotsRatio = (total: number, remaining: number): number =>
  total > 0 ? spotsTaken(total, remaining) / total : 0;

/** Miles con punto, como se escriben en Colombia. */
export const formatSpots = (value: number): string => value.toLocaleString('es-CO');
