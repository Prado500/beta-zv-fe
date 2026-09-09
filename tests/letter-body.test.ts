import { describe, expect, it } from 'vitest';
import { composeBody, parseBody } from '../src/modules/editor/services/letterBody';
import type { DedicationForm } from '../src/modules/editor/types';

/**
 * Ida y vuelta del cuerpo: lo que `composeBody` mete al final del texto,
 * `parseBody` lo tiene que sacar entero y sin tocar el mensaje. Es el contrato
 * que el visor necesita para firmar la carta y montar el reproductor.
 */

const form = (overrides: Partial<DedicationForm> = {}): DedicationForm => ({
  title: 'Feliz Aniversario',
  recipient: 'Ana María',
  recipientEmail: 'sebas@ejemplo.com',
  sender: 'Sebastián',
  message: 'Gracias por cada día a tu lado, mi amor.',
  songUrl: 'https://youtu.be/dQw4w9WgXcQ',
  themeId: 'classic',
  photos: [],
  ...overrides,
});

describe('parseBody', () => {
  it('recupera mensaje, firma y canción de un cuerpo completo', () => {
    expect(parseBody(composeBody(form()))).toEqual({
      message: 'Gracias por cada día a tu lado, mi amor.',
      sender: 'Sebastián',
      songUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
  });

  it('con solo firma, o solo canción, o ninguna de las dos', () => {
    expect(parseBody(composeBody(form({ songUrl: '' })))).toEqual({
      message: 'Gracias por cada día a tu lado, mi amor.',
      sender: 'Sebastián',
      songUrl: '',
    });
    expect(parseBody(composeBody(form({ sender: '' })))).toEqual({
      message: 'Gracias por cada día a tu lado, mi amor.',
      sender: '',
      songUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
    expect(parseBody(composeBody(form({ sender: '', songUrl: '' })))).toEqual({
      message: 'Gracias por cada día a tu lado, mi amor.',
      sender: '',
      songUrl: '',
    });
  });

  it('un "De parte de:" dentro del mensaje es del mensaje', () => {
    const message = 'Te escribo esto.\nDe parte de: todos los que te queremos.\nY de mí, sobre todo.';
    expect(parseBody(composeBody(form({ message })))).toEqual({
      message,
      sender: 'Sebastián',
      songUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
  });

  it('tolera retornos de carro, un solo salto de línea y espacios de sobra', () => {
    const body = 'Hola.\r\nDe parte de:   Mamá   \r\nCanción: https://youtu.be/dQw4w9WgXcQ   \r\n';
    expect(parseBody(body)).toEqual({
      message: 'Hola.',
      sender: 'Mamá',
      songUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
  });

  it('conserva los párrafos del mensaje tal cual', () => {
    const message = 'Primer párrafo.\n\nSegundo párrafo.\n\nTercero.';
    expect(parseBody(composeBody(form({ message }))).message).toBe(message);
  });

  it('una marca sin contenido no se traga la línea', () => {
    expect(parseBody('Hola.\n\nCanción:')).toEqual({ message: 'Hola.\n\nCanción:', sender: '', songUrl: '' });
  });

  it('un cuerpo vacío no revienta', () => {
    expect(parseBody('')).toEqual({ message: '', sender: '', songUrl: '' });
  });
});
