import { createContext } from 'react';
import { SPOTS } from '../../config/campaign';
import type { Spots } from './services/spots';

/**
 * Cupos compartidos por la landing.
 *
 * No hay estado de carga ni de error a propósito. Quien pinta el contador necesita **un
 * número, siempre**: el respaldo primero y la cifra real en cuanto responda la API. Un
 * spinner o un cero intermedio en la barra de escasez se lee como que no quedan cupos,
 * que es justo lo contrario de lo que se quiere decir.
 *
 * Si la API no responde, esto se queda en el respaldo y nadie se entera — un contador
 * ligeramente viejo es un fallo aceptable; una landing rota, no.
 */
export const FALLBACK: Spots = {
  total: SPOTS.total,
  taken: SPOTS.total - SPOTS.remaining,
  remaining: SPOTS.remaining,
};

/** `null` fuera de un `SpotsProvider`: `useSpots` lo convierte en un error claro. */
export const SpotsContext = createContext<Spots | null>(null);
