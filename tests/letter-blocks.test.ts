import { describe, expect, it } from 'vitest';
import {
  MAX_WORDS_PER_BLOCK,
  planBlocks,
  splitLong,
  withDividers,
  type Block,
} from '../src/modules/editor/components/scenes/letter/letterBlocks';

/**
 * Cómo se arma el cuerpo de la carta: trozos de lectura, fotos intercaladas
 * donde dice `photoPlan`, galería con las que sobran y una filigrana cada
 * tres párrafos. Funciones puras: se prueban con texto y números.
 */

const words = (n: number, word = 'palabra') => Array.from({ length: n }, () => word).join(' ');

const paragraph = (block: Block) => (block.type === 'p' ? block : null);

describe('letterBlocks', () => {
  it('un mensaje corto y sin fotos es un solo párrafo, sin filigranas ni galería', () => {
    const blocks = planBlocks('Gracias por cada día a tu lado, mi amor.', 0);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('p');
    expect(paragraph(blocks[0])?.segments).toEqual([
      { kind: 'text', text: 'Gracias por cada día a tu lado, mi amor.' },
    ]);
  });

  it('intercala las fotos donde dice el reparto y manda las que sobran a la galería', () => {
    const blocks = planBlocks(words(30), 3);
    const first = paragraph(blocks[0]);
    expect(first).toBeTruthy();
    // La primera foto va en la palabra 0: es el primer segmento del párrafo.
    expect(first?.segments[0]).toEqual({ kind: 'photo', index: 0, side: 'left' });
    // La segunda cae quince palabras después, en el mismo párrafo, del otro lado.
    expect(first?.segments.filter((s) => s.kind === 'photo')).toEqual([
      { kind: 'photo', index: 0, side: 'left' },
      { kind: 'photo', index: 1, side: 'right' },
    ]);
    const gallery = blocks.find((b) => b.type === 'gallery');
    expect(gallery).toEqual({ type: 'gallery', key: 'gallery', indices: [2] });
  });

  it('el texto se corta alrededor de la foto sin pegar las dos mitades', () => {
    const blocks = planBlocks(words(30), 2);
    const segments = paragraph(blocks[0])?.segments ?? [];
    const texts = segments.filter((s) => s.kind === 'text').map((s) => (s.kind === 'text' ? s.text : ''));
    expect(texts.every((t) => t.trim().length > 0)).toBe(true);
    // Delante de una foto el texto termina en espacio; el último trozo no.
    expect(texts[0]?.endsWith(' ')).toBe(true);
    expect(texts[texts.length - 1]?.endsWith(' ')).toBe(false);
  });

  it('pone una filigrana cada tres párrafos, solo si queda texto después, y nunca dos seguidas', () => {
    const message = Array.from({ length: 5 }, (_, i) => `Párrafo ${i + 1} de la carta.`).join('\n');
    const blocks = planBlocks(message, 0);
    const types = blocks.map((b) => b.type);
    expect(types).toEqual(['p', 'p', 'p', 'divider', 'p', 'p']);
    // Volver a pasar el mismo resultado no añade filigranas: la cuenta es idempotente.
    expect(withDividers(blocks).map((b) => b.type)).toEqual(types);
  });

  it('un párrafo escrito de un tirón se parte en bloques de lectura por final de frase', () => {
    const sentence = `${words(10)} fin.`;
    const long = Array.from({ length: 12 }, () => sentence).join(' ');
    const chunks = splitLong(long);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.split(/\s+/).length).toBeLessThanOrEqual(MAX_WORDS_PER_BLOCK * 1.5);
    });
    chunks.slice(0, -1).forEach((chunk) => expect(chunk.endsWith('fin.')).toBe(true));
  });

  it('un párrafo corto no se parte', () => {
    expect(splitLong('Solo unas palabras.')).toEqual(['Solo unas palabras.']);
  });
});
