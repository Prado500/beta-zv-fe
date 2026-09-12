/**
 * Dónde caen las fotos dentro del mensaje.
 *
 * Lo usan la previa del editor y el HTML descargado. Si cada uno hiciera su
 * propia cuenta, la carta que ve quien la escribe y la que abre quien la
 * recibe repartirían las fotos en sitios distintos — que es justo lo que
 * pasaba: la previa las ponía en W·k/(n+1) y las cuadraba al final de frase
 * más cercano, así que ni empezaban arriba ni quedaban a la misma distancia.
 *
 * La regla, la del exportador: la primera va en la palabra 0 —justo debajo
 * del saludo— y de ahí en adelante cada `step` palabras, con `step` fijo.
 */

/** Una foto cada tantas palabras; por debajo del umbral no se intercala. */
export const WORDS_PER_FLOAT = 15;

/** Con menos palabras que esto no se intercala ninguna. */
export const MIN_WORDS_FOR_FLOAT = 6;

/** Cuántas fotos caben intercaladas en el texto; el resto van a la galería. */
export const inlinePhotoCount = (totalWords: number, photoCount: number): number => {
  // Sin fotos no hay nada que repartir. Ojo: sin esta guarda el `Math.max(1, …)`
  // de abajo devolvía 1 y el exportador dibujaba una polaroid con src vacío.
  if (photoCount <= 0) return 0;
  if (totalWords < MIN_WORDS_FOR_FLOAT) return 0;
  return Math.max(1, Math.min(photoCount, Math.floor(totalWords / WORDS_PER_FLOAT)));
};

/**
 * Índices de palabra donde va cada foto intercalada, en orden.
 * El primero es siempre 0 y el paso es constante.
 */
export const photoSlots = (totalWords: number, photoCount: number): number[] => {
  const count = inlinePhotoCount(totalWords, photoCount);
  if (count === 0) return [];
  const step = Math.floor(totalWords / count);
  return Array.from({ length: count }, (_, i) => i * step);
};

/** Lado en el que se apoya cada foto: alternan. */
export const photoSide = (index: number): 'left' | 'right' => (index % 2 === 0 ? 'left' : 'right');
