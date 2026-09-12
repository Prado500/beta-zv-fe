/**
 * Las flores de cada tema, en un solo sitio.
 *
 * Son las versiones WebP a 360px. Los PNG originales son de 500px y ~150 KB
 * cada uno; el juego completo pasó de 3,6 MB a 393 KB. Se usan en la
 * animación de la landing y como adorno de la postal del QR.
 */
const FLOWER_URLS = import.meta.glob('../assets/flores-web/*/flor_*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** El número de carpeta corresponde al tema, igual que en el exportador. */
const THEME_BY_FOLDER: [string, string][] = [
  ['1', 'classic'],
  ['2', 'pastelPink'],
  ['3', 'sunset'],
  ['4', 'starry'],
  ['5', 'lavender'],
  ['6', 'emerald'],
  ['7', 'midnight'],
  ['8', 'vintage'],
];

export const FLOWERS_BY_THEME: Record<string, string[]> = Object.fromEntries(
  THEME_BY_FOLDER.map(([folder, themeId]) => [
    themeId,
    [1, 2, 3]
      .map((n) => FLOWER_URLS[`../assets/flores-web/tema ${folder}/flor_${n}.webp`])
      .filter(Boolean),
  ]),
);

/** Temas que sí tienen flores, en el orden de las carpetas. */
export const THEMES_WITH_FLOWERS = THEME_BY_FOLDER.map(([, id]) => id).filter(
  (id) => FLOWERS_BY_THEME[id]?.length,
);

export const flowersFor = (themeId: string): string[] =>
  FLOWERS_BY_THEME[themeId] ?? FLOWERS_BY_THEME.classic ?? [];
