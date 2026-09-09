/**
 * Fechas para leer, no para calcular.
 *
 * El backend manda ISO 8601 y el panel las enseña como se escriben en Colombia
 * ("8 de septiembre de 2026"). `Intl` ya sabe hacerlo; lo único que se decide
 * aquí es el formato, una sola vez, para que las tarjetas y los modales no acaben
 * con tres maneras distintas de escribir el mismo día.
 */

const LONG_DATE = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * `null`, vacío o una fecha ilegible devuelven cadena vacía: la vista decide si
 * omite la línea o pone un guion, pero nunca pinta "Invalid Date".
 */
export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return LONG_DATE.format(date);
};
