import { z } from 'zod';

/**
 * Reglas de validación compartidas por los formularios.
 *
 * Viven fuera de los esquemas concretos porque "qué es un nombre de persona" no
 * es una decisión del formulario de compra ni del editor: es una sola regla que
 * los dos obedecen. Escrita dos veces, acabaría divergiendo — y el usuario vería
 * que su nombre vale en una pantalla y no en la siguiente.
 */

/**
 * Nombre de persona: letras de cualquier alfabeto, tildes, espacios y los signos
 * que aparecen de verdad en un nombre (`O'Connor`, `Ana-María`, `J. Pérez`).
 *
 * `\p{L}` cubre acentos y ñ sin listarlos; con `[A-Za-z]` un `José` sería
 * inválido. Se excluyen dígitos y símbolos: un `Ana123` casi siempre es un
 * descuido, y ese nombre acaba impreso en la carta que lee otra persona.
 */
export const PERSON_NAME_RE = /^\p{L}[\p{L}\p{M}'’.\- ]*$/u;

export const NAME_ERROR = 'Solo letras, espacios y guiones: nada de números ni símbolos.';

/** Campo de nombre obligatorio, ya recortado. */
export const personName = (label: string, max = 80) =>
  z
    .string()
    .trim()
    .min(2, `${label} necesita al menos 2 letras.`)
    .max(max, `${label} no puede pasar de ${max} caracteres.`)
    .regex(PERSON_NAME_RE, NAME_ERROR);

/** Igual que `personName`, pero admite el campo vacío. */
export const optionalPersonName = (max = 80) =>
  z
    .string()
    .trim()
    .max(max, `No puede pasar de ${max} caracteres.`)
    .refine((value) => value === '' || PERSON_NAME_RE.test(value), NAME_ERROR);

/** Correo obligatorio. El mensaje es el que ve el usuario mientras escribe. */
export const email = (message = 'Escribe un correo válido, como ana@ejemplo.com.') =>
  z.string().trim().min(1, 'El correo es obligatorio.').pipe(z.email(message));
