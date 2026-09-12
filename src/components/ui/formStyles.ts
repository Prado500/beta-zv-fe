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

/*
 * El aviso es el borde, no el campo entero.
 *
 * El error tenía además el fondo teñido de rojo (`bg-error/5`): con tres campos
 * vacíos a la vez el formulario se encendía entero y parecía una bronca, cuando
 * lo único que pasa es que faltan datos. Basta con el borde.
 *
 * Y el verde era esmeralda puro, un color que no existe en el resto de la
 * paleta; aquí va apagado, que confirmar no necesita gritar.
 */
const TONES: Record<FieldTone, string> = {
  idle: 'border-wine/15 focus:border-wine focus:ring-wine/15',
  error: 'border-error/70 focus:border-error focus:ring-error/15',
  valid: 'border-emerald-600/35 focus:border-emerald-600/60 focus:ring-emerald-600/10',
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
