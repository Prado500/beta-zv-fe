import React, { useMemo } from 'react';
import { hexToRgb, rgbToHex, type ThemePalette } from '../../../../utils/themePalette';
import type { ThemeDecor } from '../../../../utils/themeDecor';

/**
 * Momento 2: la floración.
 *
 * Antes eran 32 PNG disparados hacia afuera durante 2,8 s. Ahora es un
 * crecimiento: los tallos se dibujan desde el borde inferior (`pathLength` +
 * `stroke-dashoffset`), a mitad de camino abren un par de hojas y en la punta
 * abre una de las flores PNG del tema. Crece del centro hacia afuera, con
 * 90 ms entre tallos, y todo cabe en `BLOOM_TOTAL_MS`.
 *
 * Va todo dentro de un único SVG con `viewBox` 320×640: tallos, hojas y flores
 * comparten coordenadas y se escalan juntos, tanto en la previa del editor
 * como a pantalla completa. Colores: sólo los de la paleta y el decor del
 * tema — el tallo es el acento hundido hacia la tinta; las hojas, el metal.
 */

/** Duración total; PhonePreview espera esto antes de seguir. */
export const BLOOM_TOTAL_MS = 2400;

const STEM_STAGGER_MS = 110;
const STEM_DRAW_MS = 800;
const LEAF_MS = 420;
const FLOWER_DELAY_MS = 580;
const FLOWER_MS = 560;
/** El último tallo abre su flor a los ~1800 ms; el resto es aire antes de irse. */
const EXIT_AT_MS = 2100;
const EXIT_MS = 300;

interface StemSpec {
  baseX: number;
  tipX: number;
  height: number;
  /** Lado de la flor, en unidades del viewBox. */
  size: number;
}

/**
 * Siete tallos repartidos a lo ancho; el del centro es el más alto. Los
 * valores son a mano, no aleatorios: así la previa y la carta abierta
 * florecen igual.
 */
const STEMS: StemSpec[] = [
  { baseX: 38, tipX: 30, height: 236, size: 82 },
  { baseX: 84, tipX: 70, height: 312, size: 94 },
  { baseX: 128, tipX: 118, height: 372, size: 106 },
  { baseX: 168, tipX: 174, height: 404, size: 116 },
  { baseX: 212, tipX: 224, height: 356, size: 102 },
  { baseX: 254, tipX: 266, height: 296, size: 90 },
  { baseX: 292, tipX: 300, height: 226, size: 80 },
];

const CENTER = 3;
const BASE_Y = 660;

interface Pt {
  x: number;
  y: number;
}

/** Punto y tangente de una cúbica en t. */
const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): { p: Pt; angle: number } => {
  const u = 1 - t;
  const x = u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x;
  const y = u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y;
  const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return { p: { x, y }, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
};

const mix = (from: string, to: string, t: number): string => {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
};

const CSS = `
.bloom-scene {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  overflow: hidden;
  animation: bloomExit ${EXIT_MS}ms var(--ease) ${EXIT_AT_MS}ms forwards;
}
.bloom-scene svg { display: block; width: 100%; height: 100%; }

.bloom-stem {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  opacity: 0;
  animation: stemDraw ${STEM_DRAW_MS}ms var(--ease) var(--d) forwards;
}
.bloom-leaf {
  transform-box: fill-box;
  transform-origin: 0% 50%;
  transform: scale(0);
  opacity: 0;
  animation: leafOpen ${LEAF_MS}ms var(--ease) var(--d) forwards;
}
.bloom-flower {
  transform-box: fill-box;
  transform-origin: 50% 55%;
  transform: translateY(8px) scale(0.15) rotate(-14deg);
  opacity: 0;
  animation: flowerOpen ${FLOWER_MS}ms var(--ease) var(--d) forwards;
}

@keyframes stemDraw {
  0%   { stroke-dashoffset: 100; opacity: 0; }
  8%   { opacity: 0.95; }
  100% { stroke-dashoffset: 0; opacity: 0.95; }
}
@keyframes leafOpen {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 0.9; }
}
@keyframes flowerOpen {
  from { transform: translateY(8px) scale(0.15) rotate(-14deg); opacity: 0; }
  to   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
}
@keyframes bloomExit {
  to { opacity: 0; transform: translateY(-10px) scale(1.03); }
}

/* La floración se muestra también con "Reducir movimiento": es la escena, no
   un adorno. Nada que apagar aquí. */
`;

interface BloomSceneProps {
  /** Las 3 flores PNG del tema, en orden. */
  flowers: string[];
  palette: ThemePalette;
  decor: ThemeDecor;
}

export const BloomScene: React.FC<BloomSceneProps> = ({ flowers, palette, decor }) => {
  const stemColor = mix(palette.accent, palette.text, 0.35);
  const leafColor = decor.metal;

  const stems = useMemo(
    () =>
      STEMS.map((s, i) => {
        const order = Math.abs(i - CENTER) * 2 - (i < CENTER ? 1 : 0);
        const delay = Math.max(0, order) * STEM_STAGGER_MS;
        const tipY = BASE_Y - s.height;
        const drift = s.tipX - s.baseX;

        const p0 = { x: s.baseX, y: BASE_Y };
        const p1 = { x: s.baseX + drift * 0.1, y: BASE_Y - s.height * 0.45 };
        const p2 = { x: s.tipX - drift * 0.2, y: BASE_Y - s.height * 0.82 };
        const p3 = { x: s.tipX, y: tipY };
        const d = `M${p0.x} ${p0.y} C${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${p2.x.toFixed(
          1,
        )} ${p2.y.toFixed(1)} ${p3.x} ${p3.y}`;

        // Dos hojas, una a cada lado, en puntos reales de la curva
        const leaves = [
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
          key: i,
          d,
          delay,
          tip: p3,
          size: s.size,
          asset: flowers[i % Math.max(1, flowers.length)],
          leaves,
          flowerDelay: delay + FLOWER_DELAY_MS,
        };
      }),
    [flowers],
  );

  return (
    <div className="bloom-scene" aria-hidden="true">
      <style>{CSS}</style>
      <svg viewBox="0 0 320 640" preserveAspectRatio="xMidYMax slice">
        {/* Tallos y hojas debajo; las flores encima de todos los tallos */}
        {stems.map((s) => (
          <g key={`stem-${s.key}`}>
            <path
              className="bloom-stem"
              d={s.d}
              pathLength={100}
              stroke={stemColor}
              style={{ '--d': `${s.delay}ms` } as React.CSSProperties}
            />
            {s.leaves.map((leaf, li) => (
              <g key={li} transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.rot.toFixed(1)})`}>
                <path
                  className="bloom-leaf"
                  d={`M0 0 C${leaf.len * 0.3} -${leaf.len * 0.32} ${leaf.len * 0.75} -${leaf.len * 0.34} ${leaf.len} 0 C${leaf.len * 0.75} ${leaf.len * 0.34} ${leaf.len * 0.3} ${leaf.len * 0.32} 0 0 Z`}
                  fill={leafColor}
                  style={{ '--d': `${leaf.delay}ms` } as React.CSSProperties}
                />
              </g>
            ))}
          </g>
        ))}
        {stems.map((s) =>
          s.asset ? (
            <image
              key={`flower-${s.key}`}
              className="bloom-flower"
              href={s.asset}
              x={s.tip.x - s.size / 2}
              y={s.tip.y - s.size * 0.55}
              width={s.size}
              height={s.size}
              preserveAspectRatio="xMidYMid meet"
              style={{ '--d': `${s.flowerDelay}ms` } as React.CSSProperties}
            />
          ) : null,
        )}
      </svg>
    </div>
  );
};
