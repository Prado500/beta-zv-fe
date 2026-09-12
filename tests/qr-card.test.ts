import { describe, expect, it } from 'vitest';
import { CARD_FLOWERS, fitNote, qrCardMetrics } from '../src/utils/qrCard';

/**
 * Las medidas de la postal y el recorte de la nota: lo que hace que la postal
 * de pantalla y el PNG salgan iguales.
 */

/** Medidor de prueba: un píxel por carácter. */
const byLength = (text: string) => text.length;

describe('qrCard', () => {
  it('la postal sin nota es exactamente la banda de la nota más baja', () => {
    const withNote = qrCardMetrics(212);
    const bare = qrCardMetrics(212, false);
    expect(withNote.height - bare.height).toBe(withNote.noteLine * 2 + withNote.gapAfterNote);
    expect(withNote.width).toBe(bare.width);
  });

  it('todo escala con el lado del código', () => {
    const small = qrCardMetrics(106);
    const big = qrCardMetrics(212);
    expect(big.width).toBeGreaterThan(small.width);
    expect(big.padX).toBe(small.padX * 2);
  });

  it('fitNote deja la nota entera cuando cabe', () => {
    expect(fitNote('corta', 100, byLength)).toBe('corta');
  });

  it('fitNote corta por palabras y cierra con puntos suspensivos', () => {
    expect(fitNote('una frase bastante larga para el ancho', 12, byLength)).toBe('una frase…');
  });

  it('fitNote corta por letras cuando ni la primera palabra cabe', () => {
    expect(fitNote('supercalifragilistico', 5, byLength)).toBe('supe…');
  });

  it('las flores de fondo quedan dentro de la postal y en los costados', () => {
    CARD_FLOWERS.forEach((flower) => {
      expect(flower.x + flower.size).toBeLessThanOrEqual(1);
      expect(flower.y).toBeGreaterThanOrEqual(0);
      expect(flower.alpha).toBeLessThan(0.6);
    });
  });
});
