/**
 * Tipos de documento: lo que se ve y lo que se guarda.
 *
 * La persona elige una etiqueta ("Cédula de ciudadanía"); lo que viaja al backend es
 * el **código oficial de la DIAN** (13), que es lo único que sirve para emitir una
 * factura electrónica. Esta correspondencia es normativa: no se inventa ni se ordena
 * por gusto.
 *
 * El orden de la lista sí es una decisión de producto: primero lo que usa casi todo
 * el mundo, y el NIT al final porque es de empresa. Quien busca el suyo lo encuentra
 * sin desplegar del todo.
 *
 * El backend tiene su propia copia en `be/app/core/dian.py`. Si cambias una etiqueta
 * o un código aquí, cambia la otra: son la misma tabla escrita dos veces por vivir en
 * repos distintos.
 */

export interface DocumentType {
  /** Código DIAN, como cadena: es el `value` de un `<option>`. */
  code: string;
  label: string;
}

export const DOCUMENT_TYPES: readonly DocumentType[] = [
  { code: '13', label: 'Cédula de ciudadanía' },
  { code: '12', label: 'Tarjeta de identidad' },
  { code: '11', label: 'Registro civil' },
  { code: '21', label: 'Tarjeta de extranjería' },
  { code: '22', label: 'Cédula de extranjería' },
  { code: '41', label: 'Pasaporte' },
  { code: '42', label: 'Documento de identificación extranjero' },
  { code: '91', label: 'NUIP' },
  { code: '31', label: 'NIT' },
] as const;

/**
 * Cubre a la gran mayoría de compradores. Preseleccionarla convierte el documento en
 * un campo y medio en vez de dos, que es la diferencia que se nota en la conversión.
 */
export const DEFAULT_DOCUMENT_TYPE = '13';

/** Para `z.enum`, que necesita una tupla literal no vacía. */
export const DOCUMENT_TYPE_CODES = [
  '13',
  '12',
  '11',
  '21',
  '22',
  '41',
  '42',
  '91',
  '31',
] as const;

/** Pasaporte y documento extranjero llevan letras; el resto son solo dígitos. */
const ALPHANUMERIC = new Set(['41', '42']);

/** Los mismos límites que `be/app/core/dian.py`: ni uno más, ni uno menos. */
const MIN_LENGTH = 5;
const MAX_LENGTH = 20;

/**
 * Devuelve el problema del número, o `null` si está bien.
 *
 * Se devuelve el mensaje en vez de un booleano porque el aviso depende del tipo: a
 * quien puso una cédula hay que decirle "solo dígitos", y a quien puso un pasaporte,
 * otra cosa. Un `false` obligaría a decidir el texto en la vista.
 */
export const documentNumberProblem = (code: string, value: string): string | null => {
  const clean = value.trim().toUpperCase();
  if (clean.length < MIN_LENGTH) return `El número necesita al menos ${MIN_LENGTH} caracteres.`;
  if (clean.length > MAX_LENGTH) return `El número no puede pasar de ${MAX_LENGTH} caracteres.`;
  if (ALPHANUMERIC.has(code)) {
    return /^[A-Z0-9]+$/.test(clean) ? null : 'Solo letras y dígitos, sin espacios ni guiones.';
  }
  return /^[0-9]+$/.test(clean) ? null : 'Este tipo de documento solo admite dígitos.';
};
