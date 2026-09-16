import { apiGet } from '../../../utils/api';

/**
 * Cupos de la campaña, servidos por nuestra propia API.
 *
 * El contador dejó de ser una cifra escrita a mano: lo lleva el backend, que resta uno
 * cada vez que una compra queda pagada. Aquí solo se lee.
 */

export interface Spots {
  total: number;
  taken: number;
  remaining: number;
}

/**
 * Una sola petición por carga de página, igual que los textos legales.
 *
 * Los tres sitios que pintan la cifra —la barra superior, el medidor y la prosa de la
 * sección— montan a la vez bajo la misma landing; sin esta caché serían tres lecturas
 * idénticas para enseñar el mismo número.
 */
let cached: Promise<Spots> | null = null;

export const fetchSpots = (): Promise<Spots> => {
  cached ??= apiGet<Spots>('/api/v1/public/slots').catch((problem: unknown) => {
    // Un fallo no puede envenenar la caché: la próxima visita debe volver a pedirlo.
    cached = null;
    throw problem;
  });
  return cached;
};

/** Solo para las pruebas: vacía la caché entre casos. */
export const forgetSpots = (): void => {
  cached = null;
};
