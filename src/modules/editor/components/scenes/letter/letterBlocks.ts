import { photoSide, photoSlots } from '../../../../../utils/photoPlan';

/**
 * Cómo se reparte el cuerpo de la carta en bloques de lectura.
 *
 * Funciones puras, sin React: reciben el mensaje y cuántas fotos hay y
 * devuelven qué se pinta y en qué orden. La vista solo recorre el resultado.
 */

/**
 * Un trozo del cuerpo. La foto NO es un bloque aparte: va dentro del párrafo,
 * flotada, para que el texto la rodee sin que el párrafo se parta en dos.
 */
export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'photo'; index: number; side: 'left' | 'right' };

export type Block =
  | { type: 'p'; key: string; segments: Segment[] }
  | { type: 'gallery'; key: string; indices: number[] }
  | { type: 'divider'; key: string };

/** Un párrafo que lleva foto ya corta el ritmo por sí solo. */
const carriesPhoto = (block: Block): boolean =>
  block.type === 'p' && block.segments.some((seg) => seg.kind === 'photo');

/** Párrafos seguidos antes de intercalar una filigrana que corte el bloque. */
export const PARAGRAPHS_PER_DIVIDER = 3;

/**
 * Mete un separador cada N párrafos seguidos, pero sólo si más adelante queda
 * texto: una filigrana justo antes de la firma sobra, porque la firma ya cierra.
 * Una foto también corta el ritmo, así que reinicia la cuenta.
 */
export const withDividers = (blocks: Block[]): Block[] => {
  const out: Block[] = [];
  let run = 0;
  blocks.forEach((block, i) => {
    out.push(block);
    if (block.type !== 'p' || carriesPhoto(block)) {
      run = 0;
      return;
    }
    run++;
    const textAhead = blocks.slice(i + 1).some((b) => b.type === 'p');
    // Si la lista ya trae su filigrana aquí, no se duplica: la cuenta es idempotente.
    const alreadyThere = blocks[i + 1]?.type === 'divider';
    if (run >= PARAGRAPHS_PER_DIVIDER && textAhead && !alreadyThere) {
      out.push({ type: 'divider', key: `div-${i}` });
      run = 0;
    }
  });
  return out;
};

const endsSentence = (word: string): boolean => /[.!?…]["»)]?$/.test(word);

/** Palabras por bloque de lectura. A 17 px son unas 7 líneas en un móvil. */
export const MAX_WORDS_PER_BLOCK = 55;
/** Ningún bloque queda más corto que esto al partir. */
export const MIN_TAIL_WORDS = 12;

/**
 * Parte un párrafo largo en bloques de lectura, cortando en final de frase.
 *
 * Sin esto, un mensaje escrito de un tirón —un solo párrafo de 300 palabras—
 * salía como un único <p>: un muro de texto, sin nada que revelar al hacer
 * scroll ni sitio donde poner una filigrana. Si el texto no trae puntos, se
 * corta por palabra al pasar de vez y media el tamaño de bloque.
 */
export const splitLong = (text: string): string[] => {
  const words = text.split(/\s+/);
  if (words.length <= MAX_WORDS_PER_BLOCK) return [text];

  const chunks: string[] = [];
  let start = 0;
  for (let i = 0; i < words.length; i++) {
    const len = i - start + 1;
    const remaining = words.length - (i + 1);
    const atSentence = len >= MAX_WORDS_PER_BLOCK * 0.7 && endsSentence(words[i]);
    const tooLong = len >= MAX_WORDS_PER_BLOCK * 1.5;
    if ((atSentence || tooLong) && remaining >= MIN_TAIL_WORDS) {
      chunks.push(words.slice(start, i + 1).join(' '));
      start = i + 1;
    }
  }
  if (start < words.length) chunks.push(words.slice(start).join(' '));
  return chunks;
};

/**
 * Arma el cuerpo de la carta: trozos de lectura con las fotos intercaladas y
 * las filigranas ya puestas.
 *
 * El reparto no se calcula aquí: sale de `photoSlots`, el mismo que usa el
 * HTML descargado. La primera foto cae en la palabra 0 —debajo del saludo— y
 * las demás cada `step` palabras, todas a la misma distancia.
 *
 * La foto se mete DENTRO del trozo, no entre trozos: partir el párrafo en dos
 * metía un salto de párrafo en mitad de una frase.
 */
export const planBlocks = (message: string, photoCount: number): Block[] => {
  // Trozos de lectura, cada uno con la posición global de su primera palabra
  const chunks: { key: string; words: string[]; start: number }[] = [];
  let cursor = 0;

  message
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((paragraph, pi) => {
      splitLong(paragraph).forEach((piece, ci) => {
        const words = piece.split(/\s+/).filter(Boolean);
        if (words.length === 0) return;
        chunks.push({ key: `p-${pi}-${ci}`, words, start: cursor });
        cursor += words.length;
      });
    });

  const slots = photoSlots(cursor, photoCount);

  const blocks: Block[] = [];
  let next = 0;

  for (const chunk of chunks) {
    const segments: Segment[] = [];
    let buffer: string[] = [];

    /* `more` añade el espacio de separación: la foto flota fuera del flujo,
       así que sin él los dos trozos de texto quedarían pegados. */
    const flush = (more: boolean) => {
      if (buffer.length === 0) return;
      segments.push({ kind: 'text', text: buffer.join(' ') + (more ? ' ' : '') });
      buffer = [];
    };

    chunk.words.forEach((word, i) => {
      while (next < slots.length && slots[next] === chunk.start + i) {
        flush(true);
        segments.push({ kind: 'photo', index: next, side: photoSide(next) });
        next++;
      }
      buffer.push(word);
    });
    flush(false);

    blocks.push({ type: 'p', key: chunk.key, segments });
  }

  // Las que no cupieron intercaladas, en cuadrícula al final
  if (next < photoCount) {
    blocks.push({
      type: 'gallery',
      key: 'gallery',
      indices: Array.from({ length: photoCount - next }, (_, i) => next + i),
    });
  }

  return withDividers(blocks);
};
