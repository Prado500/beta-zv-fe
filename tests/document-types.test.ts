import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DOCUMENT_TYPE,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_CODES,
  documentNumberProblem,
} from '../src/modules/legal/documentTypes';

/**
 * El catálogo es normativa de la DIAN escrita dos veces, aquí y en
 * `be/app/core/dian.py`. Estas pruebas fijan la copia del frontend para que una
 * divergencia salga en rojo y no en un 422 que la persona no entiende.
 */

describe('catálogo DIAN', () => {
  it('ofrece las nueve opciones con su código oficial, en el orden de producto', () => {
    expect(DOCUMENT_TYPES.map((type) => type.code)).toEqual([
      '13',
      '12',
      '11',
      '21',
      '22',
      '41',
      '42',
      '91',
      '31',
    ]);
    expect(DOCUMENT_TYPES[0].label).toBe('Cédula de ciudadanía');
  });

  it('arranca en cédula de ciudadanía', () => {
    expect(DEFAULT_DOCUMENT_TYPE).toBe('13');
    expect(DOCUMENT_TYPES.some((type) => type.code === DEFAULT_DOCUMENT_TYPE)).toBe(true);
  });

  it('exige solo dígitos en los documentos colombianos', () => {
    expect(documentNumberProblem('13', '1098765432')).toBeNull();
    expect(documentNumberProblem('13', '10AB765432')).toMatch(/dígitos/i);
  });

  it('admite letras en pasaporte y documento extranjero', () => {
    expect(documentNumberProblem('41', 'AB123456')).toBeNull();
    expect(documentNumberProblem('42', 'AB123456')).toBeNull();
    expect(documentNumberProblem('42', 'XY-99')).toMatch(/letras y dígitos/i);
  });

  it('acepta el pasaporte en minúsculas: la forma canónica la pone el backend', () => {
    expect(documentNumberProblem('41', 'ab123456')).toBeNull();
  });

  it('rechaza lo demasiado corto y lo demasiado largo', () => {
    expect(documentNumberProblem('13', '123')).toMatch(/5/);
    expect(documentNumberProblem('13', '1'.repeat(21))).toMatch(/20/);
  });

  it('acepta los dos extremos del rango', () => {
    expect(documentNumberProblem('13', '12345')).toBeNull();
    expect(documentNumberProblem('13', '1'.repeat(20))).toBeNull();
  });

  it('no cuenta los espacios de los lados como parte del número', () => {
    expect(documentNumberProblem('13', '  1098765432  ')).toBeNull();
    expect(documentNumberProblem('13', '  123  ')).toMatch(/5/);
  });

  it('los códigos del select son exactamente los del catálogo', () => {
    expect([...DOCUMENT_TYPE_CODES].sort()).toEqual(
      DOCUMENT_TYPES.map((type) => type.code).sort(),
    );
  });
});
