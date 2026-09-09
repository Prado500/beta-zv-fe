import type { DedicationForm } from '../types';

/**
 * Cuerpo de la carta: ida y vuelta entre el formulario y el texto que guarda
 * el backend.
 *
 * `LetterCreate` no tiene campos para el remitente ni para la canción, y
 * añadirlos exige una migración. Hasta entonces viajan como dos líneas al final
 * del cuerpo. `composeBody` las escribe y `parseBody` las recupera: son la
 * misma regla vista desde los dos lados. Cuando solo existía la primera, el
 * visor pintaba "Canción: https://…" como un párrafo más, firmaba la carta con
 * "Alguien que te quiere" y nunca montaba el reproductor.
 */

export const SENDER_MARK = 'De parte de:';
export const SONG_MARK = 'Canción:';

export const composeBody = (form: DedicationForm): string => {
  const parts = [form.message.trim()];
  if (form.sender.trim()) parts.push(`${SENDER_MARK} ${form.sender.trim()}`);
  if (form.songUrl.trim()) parts.push(`${SONG_MARK} ${form.songUrl.trim()}`);
  return parts.filter(Boolean).join('\n\n');
};

export interface ParsedBody {
  message: string;
  sender: string;
  songUrl: string;
}

/** Última línea del texto que empieza por la marca; captura lo que la sigue. */
const trailingLine = (mark: string): RegExp =>
  new RegExp(`(?:^|\n)[ \t]*${mark}[ \t]*(.+?)[ \t]*$`);

/**
 * Separa mensaje, firma y canción de un cuerpo guardado.
 *
 * Las marcas van al final, en el orden en que las escribió `composeBody`, así
 * que se recortan de atrás hacia delante y solo una vez cada una: un
 * "De parte de:" en mitad del mensaje es del mensaje y ahí se queda. Tolera
 * saltos de línea simples o dobles y retornos de carro, que el backend
 * normaliza pero un cliente viejo pudo no hacerlo.
 */
export const parseBody = (body: string): ParsedBody => {
  let rest = body.replace(/\r\n?/g, '\n').trimEnd();
  let sender = '';
  let songUrl = '';

  for (let pass = 0; pass < 2; pass += 1) {
    const song = songUrl ? null : rest.match(trailingLine(SONG_MARK));
    if (song?.index !== undefined) {
      songUrl = song[1];
      rest = rest.slice(0, song.index).trimEnd();
      continue;
    }
    const from = sender ? null : rest.match(trailingLine(SENDER_MARK));
    if (from?.index !== undefined) {
      sender = from[1];
      rest = rest.slice(0, from.index).trimEnd();
      continue;
    }
    break;
  }

  return { message: rest.trim(), sender, songUrl };
};
