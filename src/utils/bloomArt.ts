import { hexToRgb, rgbToHex, withAlpha, type ThemePalette } from './themePalette';
import type { ThemeDecor } from './themeDecor';

/**
 * La floración: tallos que se dibujan, hojas que se abren y flores que brotan
 * sobre el pasto. Es el primer momento después del sobre.
 *
 * Aquí vive TODO lo que define la escena —medidas, tiempos, colores y el
 * dibujo— porque la pintan dos sitios distintos: la previa de React
 * (`scenes/BloomScene.tsx`) y el HTML que se descarga (`utils/export`). Cuando
 * cada uno tenía su copia, tocar una posición en la app dejaba el archivo
 * exportado contando otra historia. Un solo origen y ese problema no existe.
 *
 * La previa arma elementos de React sobre estos datos porque necesita
 * memoizarlos; el exportador usa `bloomSvg`, que devuelve el mismo dibujo ya
 * escrito. Si tocas la estructura de uno, mira el otro.
 */

export const BLOOM_TOTAL_MS = 2800;

export const STEM_STAGGER_MS = 110;
export const STEM_DRAW_MS = 800;
export const LEAF_MS = 420;
export const FLOWER_DELAY_MS = 580;
export const FLOWER_MS = 620;
/** Separación entre flores: reparte el coste de rasterizar cada imagen. */
export const FLOWER_SPREAD_MS = 45;
export const GLOW_MS = 760;
export const EXIT_AT_MS = 2500;
export const EXIT_MS = 300;

export const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export interface StemSpec {
  baseX: number;
  tipX: number;
  height: number;
  size: number;
}

export const STEMS: StemSpec[] = [
  { baseX: 38, tipX: 30, height: 236, size: 82 },
  { baseX: 84, tipX: 70, height: 312, size: 94 },
  { baseX: 128, tipX: 118, height: 372, size: 106 },
  { baseX: 168, tipX: 174, height: 404, size: 116 },
  { baseX: 212, tipX: 224, height: 356, size: 102 },
  { baseX: 254, tipX: 266, height: 296, size: 90 },
  { baseX: 292, tipX: 300, height: 226, size: 80 },
];

export const BACK_STEMS: StemSpec[] = [
  { baseX: 16, tipX: 8, height: 168, size: 54 },
  { baseX: 62, tipX: 52, height: 214, size: 62 },
  { baseX: 106, tipX: 98, height: 186, size: 56 },
  { baseX: 192, tipX: 200, height: 200, size: 60 },
  { baseX: 236, tipX: 246, height: 172, size: 54 },
  { baseX: 276, tipX: 286, height: 208, size: 60 },
];

export const LOW_STEMS: StemSpec[] = [
  { baseX: 26, tipX: 20, height: 96, size: 44 },
  { baseX: 106, tipX: 100, height: 120, size: 50 },
  { baseX: 150, tipX: 156, height: 84, size: 40 },
  { baseX: 224, tipX: 230, height: 112, size: 48 },
  { baseX: 302, tipX: 308, height: 92, size: 42 },
];

export interface Blade {
  x: number;
  h: number;
  bend: number;
  w: number;
  delay: number;
  front: number;
}

export const GRASS: Blade[] = [
  { x: 4, h: 128, bend: -26, w: 6, delay: 40, front: 0 },
  { x: 14, h: 176, bend: -12, w: 6, delay: 100, front: 1 },
  { x: 24, h: 142, bend: 18, w: 5, delay: 70, front: 0 },
  { x: 34, h: 104, bend: 26, w: 5, delay: 150, front: 1 },
  { x: 48, h: 158, bend: -20, w: 6, delay: 120, front: 0 },
  { x: 58, h: 118, bend: 14, w: 5, delay: 200, front: 1 },
  { x: 70, h: 186, bend: -16, w: 6, delay: 80, front: 0 },
  { x: 82, h: 132, bend: 22, w: 5, delay: 230, front: 1 },
  { x: 94, h: 150, bend: -24, w: 5, delay: 130, front: 0 },
  { x: 106, h: 194, bend: 12, w: 6, delay: 60, front: 0 },
  { x: 118, h: 126, bend: 20, w: 5, delay: 250, front: 1 },
  { x: 130, h: 100, bend: -18, w: 4, delay: 300, front: 1 },
  { x: 142, h: 168, bend: 16, w: 6, delay: 110, front: 0 },
  { x: 154, h: 136, bend: -14, w: 5, delay: 270, front: 1 },
  { x: 168, h: 202, bend: 18, w: 6, delay: 50, front: 0 },
  { x: 180, h: 118, bend: -22, w: 5, delay: 240, front: 1 },
  { x: 192, h: 158, bend: 14, w: 6, delay: 140, front: 0 },
  { x: 204, h: 128, bend: -12, w: 5, delay: 290, front: 1 },
  { x: 216, h: 182, bend: 20, w: 6, delay: 90, front: 0 },
  { x: 228, h: 108, bend: -20, w: 4, delay: 310, front: 1 },
  { x: 240, h: 148, bend: 12, w: 5, delay: 160, front: 0 },
  { x: 252, h: 172, bend: 22, w: 6, delay: 105, front: 0 },
  { x: 264, h: 124, bend: -16, w: 5, delay: 260, front: 1 },
  { x: 276, h: 154, bend: 18, w: 6, delay: 135, front: 0 },
  { x: 288, h: 112, bend: -24, w: 5, delay: 280, front: 1 },
  { x: 298, h: 178, bend: 14, w: 6, delay: 75, front: 0 },
  { x: 308, h: 130, bend: 20, w: 5, delay: 220, front: 1 },
  { x: 316, h: 152, bend: -10, w: 6, delay: 155, front: 0 },
];

export const bladePath = (b: Blade, baseY: number): string =>
  `M${b.x} ${baseY} Q${(b.x + b.bend * 0.35).toFixed(1)} ${(baseY - b.h * 0.62).toFixed(1)} ${b.x + b.bend} ${baseY - b.h} Q${(b.x + b.bend * 0.1 + b.w * 0.5).toFixed(1)} ${(baseY - b.h * 0.5).toFixed(1)} ${b.x + b.w} ${baseY} Z`;

export const CENTER = 3;
export const BASE_Y = 660;

export const MOTES = [
  { x: 46, y: 470, s: 7, r: 12, delay: 420, rise: 150 },
  { x: 92, y: 380, s: 5, r: -20, delay: 700, rise: 190 },
  { x: 138, y: 300, s: 9, r: 6, delay: 900, rise: 210 },
  { x: 176, y: 250, s: 6, r: -10, delay: 1080, rise: 230 },
  { x: 214, y: 320, s: 8, r: 16, delay: 830, rise: 200 },
  { x: 262, y: 410, s: 5, r: -14, delay: 620, rise: 170 },
  { x: 300, y: 490, s: 7, r: 8, delay: 500, rise: 150 },
  { x: 70, y: 540, s: 5, r: -6, delay: 1180, rise: 160 },
  { x: 118, y: 430, s: 6, r: 22, delay: 1320, rise: 180 },
  { x: 200, y: 460, s: 5, r: -18, delay: 1420, rise: 170 },
  { x: 248, y: 540, s: 7, r: 10, delay: 1260, rise: 160 },
  { x: 288, y: 360, s: 6, r: -8, delay: 1500, rise: 190 },
];

export interface Pt {
  x: number;
  y: number;
}

export const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): { p: Pt; angle: number } => {
  const u = 1 - t;
  const x = u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x;
  const y = u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y;
  const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return { p: { x, y }, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
};

export const mix = (from: string, to: string, t: number): string => {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
};

export interface Stalk {
  key: string;
  d: string;
  delay: number;
  tip: Pt;
  baseX: number;
  size: number;
  asset: string | undefined;
  leaves: { x: number; y: number; rot: number; len: number; delay: number }[];
  flowerDelay: number;
  back: boolean;
}

/**
 * Los 18 tallos, en orden de dibujo: primero las dos filas de atrás y luego la
 * de delante.
 *
 * `seq` cuenta flores a lo largo de las tres filas y les da un desfase propio.
 * No es estética: cada imagen se rasteriza la primera vez que se pinta, y con
 * las filas calculando su orden por separado media docena caía en el mismo
 * fotograma — 300 ms de tirón justo al empezar. Repartido, el trabajo se hace
 * de a poco y además se ve como una ola, no como un telón que se levanta de
 * golpe.
 */
export const bloomStalks = (flowers: string[]): Stalk[] => {
  let seq = 0;

  const build = (specs: StemSpec[], back: boolean): Stalk[] =>
    specs.map((s, i) => {
      const rasterOffset = seq++ * FLOWER_SPREAD_MS;
      const order = back
        ? Math.abs(i - specs.length / 2) * 2
        : Math.max(0, Math.abs(i - CENTER) * 2 - (i < CENTER ? 1 : 0));

      const delay = order * STEM_STAGGER_MS + (back ? 0 : 90);
      const tipY = BASE_Y - s.height;
      const drift = s.tipX - s.baseX;

      const p0 = { x: s.baseX, y: BASE_Y };
      const p1 = { x: s.baseX + drift * 0.1, y: BASE_Y - s.height * 0.45 };
      const p2 = { x: s.tipX - drift * 0.2, y: BASE_Y - s.height * 0.82 };
      const p3 = { x: s.tipX, y: tipY };
      const d = `M${p0.x} ${p0.y} C${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${p2.x.toFixed(
        1,
      )} ${p2.y.toFixed(1)} ${p3.x} ${p3.y}`;

      const leaves = back
        ? []
        : [
            { t: 0.42, side: -1, len: 20 },
            { t: 0.64, side: 1, len: 17 },
          ].map(({ t, side, len }) => {
            const { p, angle } = cubicAt(p0, p1, p2, p3, t);
            return {
              x: p.x,
              y: p.y,
              rot: angle + side * 52,
              len,
              delay: delay + STEM_DRAW_MS * t + 40,
            };
          });

      return {
        key: `${back ? 'b' : 'f'}${i}`,
        d,
        delay,
        tip: p3,
        baseX: s.baseX,
        size: s.size,
        asset: flowers[(back ? i + 1 : i) % Math.max(1, flowers.length)],
        leaves,
        flowerDelay: delay + FLOWER_DELAY_MS + rasterOffset,
        back,
      };
    });

  return [...build(BACK_STEMS, true), ...build(LOW_STEMS, true), ...build(STEMS, false)];
};

/** El pétalo de una mota, centrado en su propio origen. */
export const motePath = (s: number): string =>
  `M0 ${-s} Q${s * 0.22} ${-s * 0.22} ${s} 0 Q${s * 0.22} ${s * 0.22} 0 ${s} Q${-s * 0.22} ${s * 0.22} ${-s} 0 Q${-s * 0.22} ${-s * 0.22} 0 ${-s} Z`;

/** La hoja: una lente que sale del tallo hacia el lado que le toca. */
export const leafPath = (len: number): string =>
  `M0 0 C${len * 0.3} -${len * 0.32} ${len * 0.75} -${len * 0.34} ${len} 0 C${len * 0.75} ${len * 0.34} ${len * 0.3} ${len * 0.32} 0 0 Z`;

/** Los cuatro colores que el tema le presta a la escena. */
export const bloomColors = (palette: ThemePalette, decor: ThemeDecor) => ({
  stem: mix(palette.accent, palette.text, 0.35),
  leaf: decor.metal,
  glow: palette.accent,
  grassBack: mix(decor.metal, palette.text, 0.45),
  grassFront: mix(decor.metal, palette.accent, 0.25),
});

/*
 * Ojo con los acentos graves aquí dentro: esto vive en una plantilla de texto
 * y uno solo la cierra antes de tiempo.
 */
export const BLOOM_CSS = `
.bloom-scene {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  overflow: hidden;
  transform: translateZ(0);
  backface-visibility: hidden;
}
.bloom-scene svg { display: block; width: 100%; height: 100%; }

.bloom-stem {
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  opacity: 0;
}
.bloom-leaf {
  transform-box: fill-box;
  transform-origin: 0% 50%;
  transform: scale3d(0, 0, 1);
  opacity: 0;
  will-change: transform, opacity;
}
.bloom-flower {
  transform-box: fill-box;
  transform-origin: 50% 55%;
  will-change: transform, opacity;
  transform: translate3d(0, 10px, 0) scale3d(0.12, 0.12, 1) rotate(-16deg);
  opacity: 0;
}
.bloom-glow {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  transform: scale3d(0.2, 0.2, 1);
  opacity: 0;
  will-change: transform, opacity;
}
.bloom-blade {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform: scale3d(1, 0, 1);
  opacity: 0;
  will-change: transform, opacity;
}
@keyframes bladeGrow {
  from { transform: scale3d(0.7, 0, 1); opacity: 0; }
  to   { transform: scale3d(1, 1, 1); opacity: var(--o); }
}
.bloom-mote {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  opacity: 0;
  will-change: transform, opacity;
}

/*
 * Las animaciones cuelgan de la clase is-running, que se enciende cuando toca.
 *
 * La escena se monta mucho antes, con el teléfono todavía en el sobre: crear
 * sus ~90 elementos cuesta unos 250 ms de JavaScript, y hacerlo en el mismo
 * instante en que empieza a florecer metía ese trabajo dentro de la
 * animación — era el tirón. Montada de antemano, arrancar es solo añadir
 * una clase.
 */
.bloom-scene.is-running { animation: bloomExit ${EXIT_MS}ms var(--ease) ${EXIT_AT_MS}ms forwards; }
.is-running .bloom-stem { animation: stemDraw ${STEM_DRAW_MS}ms var(--ease) var(--d) forwards; }
.is-running .bloom-leaf { animation: leafOpen ${LEAF_MS}ms var(--ease) var(--d) forwards; }
.is-running .bloom-flower { animation: flowerOpen ${FLOWER_MS}ms ${POP} var(--d) forwards; }
.is-running .bloom-glow { animation: glowBurst ${GLOW_MS}ms var(--ease) var(--d) forwards; }
.is-running .bloom-blade { animation: bladeGrow 620ms var(--ease) var(--d) forwards; }
.is-running .bloom-mote { animation: moteRise 1500ms var(--ease) var(--d) forwards; }

@keyframes stemDraw {
  0%   { stroke-dashoffset: 100; opacity: 0; }
  8%   { opacity: 0.95; }
  100% { stroke-dashoffset: 0; opacity: 0.95; }
}
@keyframes leafOpen {
  from { transform: scale3d(0, 0, 1); opacity: 0; }
  to   { transform: scale3d(1, 1, 1); opacity: 0.9; }
}
@keyframes flowerOpen {
  from { transform: translate3d(0, 10px, 0) scale3d(0.12, 0.12, 1) rotate(-16deg); opacity: 0; }
  to   { transform: translate3d(0, 0, 0) scale3d(1, 1, 1) rotate(0deg); opacity: 1; }
}
@keyframes glowBurst {
  0%   { transform: scale3d(0.2, 0.2, 1); opacity: 0; }
  35%  { transform: scale3d(1.15, 1.15, 1); opacity: 0.85; }
  100% { transform: scale3d(1.5, 1.5, 1); opacity: 0; }
}
@keyframes moteRise {
  0%   { transform: translate3d(0, 0, 0) scale3d(0.4, 0.4, 1); opacity: 0; }
  25%  { opacity: 0.9; }
  100% { transform: translate3d(0, calc(var(--rise) * -1px), 0) scale3d(1, 1, 1); opacity: 0; }
}
@keyframes bloomExit {
  to { opacity: 0; transform: translate3d(0, -10px, 0) scale3d(1.03, 1.03, 1); }
}
`;

/**
 * El mismo dibujo de la previa, ya escrito, para el HTML que se descarga.
 * `uid` separa los degradados por si algún día hay dos escenas en una página.
 */
export const bloomSvg = (
  flowers: string[],
  palette: ThemePalette,
  decor: ThemeDecor,
  uid = 'bloom',
): string => {
  const color = bloomColors(palette, decor);
  const stalks = bloomStalks(flowers);

  const blades = (front: boolean, fill: string, alpha: number): string =>
    GRASS.filter((b) => Boolean(b.front) === front)
      .map(
        (b) =>
          `<path class="bloom-blade" d="${bladePath(b, BASE_Y)}" fill="${fill}" style="--d: ${b.delay}ms; --o: ${alpha};"/>`,
      )
      .join('');

  const stems = stalks
    .map(
      (s) =>
        `<g><path class="bloom-stem" d="${s.d}" pathLength="100" stroke="${color.stem}" stroke-width="${
          s.back ? 1.6 : 2.4
        }" opacity="${s.back ? 0.45 : 1}" style="--d: ${s.delay}ms;"/>${s.leaves
          .map(
            (leaf) =>
              `<g transform="translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.rot.toFixed(
                1,
              )})"><path class="bloom-leaf" d="${leafPath(leaf.len)}" fill="${color.leaf}" style="--d: ${Math.round(
                leaf.delay,
              )}ms;"/></g>`,
          )
          .join('')}</g>`,
    )
    .join('');

  const blooms = stalks
    .filter((s) => s.asset)
    .map(
      (s) =>
        `<g><circle class="bloom-glow" cx="${s.tip.x}" cy="${s.tip.y}" r="${(
          s.size * (s.back ? 0.5 : 0.62)
        ).toFixed(1)}" fill="url(#${uid}-glow)" style="--d: ${Math.round(
          s.flowerDelay,
        )}ms;"/><image class="bloom-flower" href="${s.asset}" x="${(s.tip.x - s.size / 2).toFixed(1)}" y="${(
          s.tip.y -
          s.size * 0.55
        ).toFixed(1)}" width="${s.size}" height="${s.size}" opacity="${
          s.back ? 0.55 : 1
        }" preserveAspectRatio="xMidYMid meet" style="--d: ${Math.round(s.flowerDelay)}ms;"/></g>`,
    )
    .join('');

  const motes = MOTES.map(
    (m, i) =>
      `<g class="bloom-mote" transform="translate(${m.x} ${m.y}) rotate(${m.r})" style="--d: ${m.delay}ms; --rise: ${m.rise};"><path d="${motePath(
        m.s,
      )}" fill="${i % 3 === 0 ? withAlpha(color.leaf, 0.9) : withAlpha(color.glow, 0.85)}"/></g>`,
  ).join('');

  return `<svg viewBox="0 0 320 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <radialGradient id="${uid}-glow">
      <stop offset="0" stop-color="${color.glow}" stop-opacity="0.7"/>
      <stop offset="0.45" stop-color="${color.glow}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${color.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${uid}-ground">
      <stop offset="0" stop-color="${color.glow}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${color.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="160" cy="644" rx="180" ry="72" fill="url(#${uid}-ground)"/>
  ${blades(false, color.grassBack, 0.5)}
  ${stems}
  ${blooms}
  ${blades(true, color.grassFront, 0.85)}
  ${motes}
</svg>`;
};
