/**
 * Vestuario compartido de los campos de formulario.
 *
 * El estado de un campo se ve antes de leerse: rojo mientras algo está mal,
 * verde en cuanto se corrige, neutro si aún no se ha tocado. Ese lenguaje tiene
 * que ser el mismo en la compra y en el editor, así que vive en un solo sitio;
 * repetir la cadena de clases en cada `input` es cómo se acaba con dos rojos
 * distintos y un campo que nunca avisa.
 */

export type FieldTone = 'idle' | 'error' | 'valid';

const BASE =
  'w-full bg-paper/60 rounded-xl px-4 py-3 outline-none border transition-all focus:bg-white focus:ring-2';

const TONES: Record<FieldTone, string> = {
  idle: 'border-wine/15 focus:border-wine focus:ring-wine/15',
  error: 'border-error bg-error/5 focus:border-error focus:ring-error/20',
  valid: 'border-emerald-500/70 focus:border-emerald-600 focus:ring-emerald-500/20',
};

/**
 * `touched` evita el rojo prematuro: nadie merece que le griten por un campo que
 * todavía no ha escrito. Una vez tocado, el veredicto se actualiza en cada tecla.
 */
export const fieldTone = (hasError: boolean, touched: boolean): FieldTone => {
  if (hasError) return 'error';
  return touched ? 'valid' : 'idle';
};

export const fieldClass = (tone: FieldTone, extra = ''): string =>
  `${BASE} ${TONES[tone]} ${extra}`.trim();

export const LABEL = 'block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5';

export const HINT = 'text-xs text-wine/60 mt-1.5 flex items-start gap-1.5';
