import { describe, expect, it } from 'vitest';
import { inlinePhotoCount, photoSide, photoSlots } from '../src/utils/photoPlan';

/**
 * Dónde caen las fotos dentro del mensaje. Lo comparten la previa del editor
 * y el HTML descargado: si la cuenta cambia, cambia para los dos.
 */
describe('photoPlan', () => {
  it('sin fotos no hay nada que repartir, aunque el texto sea largo', () => {
    expect(inlinePhotoCount(500, 0)).toBe(0);
    expect(photoSlots(500, 0)).toEqual([]);
  });

  it('con menos de seis palabras ninguna foto se intercala', () => {
    expect(photoSlots(5, 3)).toEqual([]);
  });

  it('con pocas palabras entra al menos una, en la palabra 0', () => {
    expect(photoSlots(9, 2)).toEqual([0]);
  });

  it('una foto cada quince palabras, a paso constante y sin pasarse de las que hay', () => {
    expect(photoSlots(30, 3)).toEqual([0, 15]);
    expect(photoSlots(100, 5)).toEqual([0, 20, 40, 60, 80]);
    expect(photoSlots(100, 1)).toEqual([0]);
  });

  it('las fotos alternan de lado', () => {
    expect([0, 1, 2, 3].map(photoSide)).toEqual(['left', 'right', 'left', 'right']);
  });
});
