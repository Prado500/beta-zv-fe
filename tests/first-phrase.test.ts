import { describe, expect, it } from 'vitest';
import { firstPhrase } from '../src/utils/firstPhrase';

/**
 * La frase suspendida y la nota de la postal salen de aquí: la primera frase
 * que dice algo, sin el saludo, sin el punto final y nunca más larga de lo
 * que cabe en pantalla.
 */
describe('firstPhrase', () => {
  it('se salta el saludo corto en su propia línea y quita el punto final', () => {
    expect(firstPhrase('Hola mi amor,\nGracias por todo. Te quiero.')).toBe('Gracias por todo');
  });

  it('los puntos suspensivos no cierran la frase; el punto simple sí', () => {
    expect(firstPhrase('Mi amor... no tengo palabras. Y más.')).toBe('Mi amor... no tengo palabras');
  });

  it('conserva la exclamación y la interrogación como cierre', () => {
    expect(firstPhrase('¿Sabes qué? Te amo.')).toBe('¿Sabes qué?');
    expect(firstPhrase('¡Feliz aniversario! Otro año juntos.')).toBe('¡Feliz aniversario!');
  });

  it('recorta en el último espacio y cierra con puntos suspensivos cuando se pasa', () => {
    const long = 'palabra '.repeat(30).trim();
    const phrase = firstPhrase(long);
    expect(phrase.endsWith('…')).toBe(true);
    expect(phrase.length).toBeLessThanOrEqual(91);
    expect(phrase).not.toContain('  ');
  });

  it('sin mensaje, o solo con espacios, no hay frase', () => {
    expect(firstPhrase('')).toBe('');
    expect(firstPhrase('   \n  ')).toBe('');
  });
});
