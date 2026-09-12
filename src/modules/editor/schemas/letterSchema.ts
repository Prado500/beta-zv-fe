import { z } from 'zod';
import { email, optionalPersonName, personName } from '../../../utils/validation';
import { getYouTubeId } from '../../../utils/youtube';

/**
 * Contrato de la carta, en un solo sitio.
 *
 * Es la misma regla la que pinta el borde rojo mientras se escribe y la que
 * decide si la petición sale: el formulario no valida "por encima" y el envío
 * "por debajo". Lo que no pasa por aquí no llega al backend, así que un 422 por
 * un nombre con números deja de ser posible.
 */

export const MAX_PHOTOS = 5;

export const photoSchema = z.object({
  tempId: z.string().nullable(),
  previewUrl: z.string(),
  fileName: z.string(),
  status: z.enum(['uploading', 'ready', 'error']),
});

export const letterSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'El título necesita al menos 3 caracteres.')
    .max(120, 'El título no puede pasar de 120 caracteres.'),

  // Nombres: sin dígitos ni símbolos. Esto se imprime en la carta que lee otra
  // persona; un "Ana123" es siempre un descuido, nunca una intención.
  recipient: personName('El nombre de quien la recibe'),

  recipientEmail: email('Escribe un correo válido: ahí llegará el regalo.'),

  sender: optionalPersonName(),

  message: z
    .string()
    .trim()
    .min(10, 'Escribe al menos unas palabras (10 caracteres).')
    .max(4000, 'El mensaje no puede pasar de 4000 caracteres.'),

  // Vacío es válido: la canción es opcional. Si hay algo, tiene que ser un
  // enlace de YouTube reconocible, o el reproductor de la carta saldría en negro.
  songUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || getYouTubeId(value) !== null,
      'Pega un enlace de YouTube válido (youtube.com/watch?v=… o youtu.be/…).',
    ),

  themeId: z.string().min(1, 'Elige un tema para la carta.'),

  photos: z.array(photoSchema).max(MAX_PHOTOS, `Puedes subir un máximo de ${MAX_PHOTOS} fotos.`),
});

export type LetterInput = z.input<typeof letterSchema>;
export type LetterValues = z.output<typeof letterSchema>;

export const EMPTY_LETTER: LetterInput = {
  title: '',
  recipient: '',
  recipientEmail: '',
  sender: '',
  message: '',
  songUrl: '',
  themeId: 'classic',
  photos: [],
};
