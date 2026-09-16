import { apiGet } from '../../../utils/api';

/**
 * Cupos de la campaña, servidos por nuestra propia API.
 *
 * El contador dejó de ser una cifra escrita a mano: lo lleva el backend, que resta uno
 * cada vez que una compra queda pagada. Aquí solo se lee.
 *
 * **Sin caché de módulo, a propósito.** Es la diferencia con los textos legales, que sí
 * la tienen: aquel texto no cambia entre dos lecturas y este número cambia con cada
 * compra. Guardar la promesa dejaría a quien vuelve a la landing —después de comprar,
 * justamente— mirando la cifra con la que entró. La deduplicación entre los tres sitios
 * que la pintan ya la da `SpotsProvider`, que pide una sola vez por montaje.
 */

export interface Spots {
  total: number;
  taken: number;
  remaining: number;
}

/**
 * Descarta lo que no sirve para pintar un contador.
 *
 * `apiGet` devuelve el JSON tal cual: un 200 con el cuerpo cambiado, un intermediario
 * que responde otra cosa o un contador sin fila en la base (que responde tres ceros)
 * llegarían hasta `toLocaleString` y reventarían el render de la landing entera. Aquí se
 * convierten en un rechazo, que es lo que el proveedor ya sabe tratar: quedarse con el
 * respaldo. Un `total` de 0 se rechaza por lo mismo: no es "agotado", es "no hay dato".
 */
const usable = (value: Spots): Spots => {
  const fields = [value?.total, value?.taken, value?.remaining];
  if (!fields.every((n) => typeof n === 'number' && Number.isFinite(n)) || value.total <= 0) {
    throw new Error('La API devolvió unos cupos que no se pueden pintar.');
  }
  return value;
};

export const fetchSpots = (): Promise<Spots> => apiGet<Spots>('/api/v1/public/slots').then(usable);
