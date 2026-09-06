export type DecorTone = 'rose' | 'gold' | 'light';

export const DECOR_TONE: Record<DecorTone, string> = {
  rose: '#b90538',
  gold: '#D4AF37',
  light: '#ffffff',
};

/** useId() devuelve ":r0:" y los dos puntos rompen url(#id) en SVG. */
export const cleanId = (id: string) => id.replace(/:/g, '');
