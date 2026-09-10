/**
 * Primera frase de una dedicatoria, para la escena suspendida de la carta.
 *
 * Reglas:
 *  - Si el mensaje abre con un saludo corto en su propia línea ("Hola mi amor,"
 *    "Querida Ana:"), se salta: la frase suspendida debe ser la primera que
 *    dice algo, no el encabezado.
 *  - La frase termina en el primer `!`, `?` o punto simple. Los puntos
 *    suspensivos ("..." o "…") no cierran: "Mi amor... no tengo palabras" es
 *    una sola frase.
 *  - Si pasa de MAX_CHARS, se corta en el último espacio y se cierra con "…".
 *  - El punto final se quita (en script sobra); `!` y `?` se quedan.
 */

const MAX_CHARS = 90;
/** Por debajo de esto no vale la pena cortar en un espacio. */
const MIN_CUT = 40;
/** Largo máximo de una línea para considerarla saludo. */
const GREETING_MAX = 32;

const isGreeting = (line: string): boolean =>
  line.length <= GREETING_MAX && /[,:]$/.test(line);

/** Índice justo después del cierre de la primera frase, o -1 si no cierra. */
const sentenceEnd = (text: string): number => {
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '!' || c === '?') {
      let j = i;
      while (j + 1 < text.length && (text[j + 1] === '!' || text[j + 1] === '?')) j++;
      if (j + 1 >= text.length || text[j + 1] === ' ') return j + 1;
      i = j;
      continue;
    }
    if (c === '.') {
      if (text[i + 1] === '.') {
        // Puntos suspensivos: no cierran la frase
        while (text[i + 1] === '.') i++;
        continue;
      }
      if (i + 1 >= text.length || text[i + 1] === ' ') return i + 1;
    }
  }
  return -1;
};

export const firstPhrase = (message: string): string => {
  const lines = message
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (lines.length === 0) return '';

  let start = 0;
  while (start < lines.length - 1 && isGreeting(lines[start])) start++;
  const text = lines.slice(start).join(' ');

  const end = sentenceEnd(text);
  let phrase = end > 0 ? text.slice(0, end) : text;

  if (phrase.length > MAX_CHARS) {
    const cut = phrase.slice(0, MAX_CHARS);
    const space = cut.lastIndexOf(' ');
    phrase = `${(space > MIN_CUT ? cut.slice(0, space) : cut).replace(/[,;:.]+$/, '')}…`;
  }

  return phrase.replace(/\.$/, '').trim();
};
