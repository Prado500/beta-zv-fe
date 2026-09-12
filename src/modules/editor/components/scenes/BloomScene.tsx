import React, { useId, useMemo } from 'react';
import { withAlpha, type ThemePalette } from '../../../../utils/themePalette';
import type { ThemeDecor } from '../../../../utils/themeDecor';
import {
  BASE_Y,
  BLOOM_CSS,
  BLOOM_TOTAL_MS,
  GRASS,
  MOTES,
  bladePath,
  bloomColors,
  bloomStalks,
  leafPath,
  motePath,
} from '../../../../utils/bloomArt';

/**
 * Momento 2: la floración.
 *
 * Medidas, tiempos, colores y CSS viven en `utils/bloomArt.ts`, que comparte
 * con el HTML descargable: cuando cada uno tenía su copia, mover una flor en
 * la app dejaba el archivo exportado contando otra historia. Aquí sólo queda
 * el armado en elementos de React, que es lo que esta versión necesita para
 * poder memoizarse.
 */

export { BLOOM_TOTAL_MS };

interface BloomSceneProps {
  /**
   * Enciende la floración. Por omisión arranca al montarse, que es como la
   * monta esta app: solo cuando toca. Pasarlo explícitamente permite montarla
   * antes, quieta, y encenderla después — crear sus ~180 elementos cuesta unos
   * 250 ms de JavaScript, y hacerlo dentro de la propia animación se nota.
   */
  active?: boolean;
  flowers: string[];
  palette: ThemePalette;
  decor: ThemeDecor;
}

/**
 * El dibujo: 181 elementos entre tallos, hojas, flores, halos, pasto y motas.
 *
 * Va aparte y memoizado porque encender la floración solo cambia una clase en
 * la raíz. Cuando todo vivía en el mismo componente, ese cambio obligaba a
 * React a reconstruir el árbol entero —228 ms de JavaScript medidos— y el
 * tirón salía justo al empezar. Aquí sus props no cambian nunca, así que
 * React se lo salta.
 *
 * La versión escrita de este mismo dibujo, para el HTML descargable, es
 * `bloomSvg` en `utils/bloomArt.ts`. Si tocas la estructura, mira la otra.
 */
const BloomArt = React.memo<Omit<BloomSceneProps, 'active'>>(({ flowers, palette, decor }) => {
  const uid = useId().replace(/:/g, '');
  const color = bloomColors(palette, decor);
  const stalks = useMemo(() => bloomStalks(flowers), [flowers]);

  return (
    <svg viewBox="0 0 320 640" preserveAspectRatio="xMidYMax slice">
      <defs>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0" stopColor={color.glow} stopOpacity="0.7" />
          <stop offset="0.45" stopColor={color.glow} stopOpacity="0.28" />
          <stop offset="1" stopColor={color.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-ground`}>
          <stop offset="0" stopColor={color.glow} stopOpacity="0.22" />
          <stop offset="1" stopColor={color.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="644" rx="180" ry="72" fill={`url(#${uid}-ground)`} />

      {GRASS.filter((b) => !b.front).map((b, i) => (
        <path
          key={`gb-${i}`}
          className="bloom-blade"
          d={bladePath(b, BASE_Y)}
          fill={color.grassBack}
          style={{ '--d': `${b.delay}ms`, '--o': 0.5 } as React.CSSProperties}
        />
      ))}

      {stalks.map((s) => (
        <g key={`stem-${s.key}`}>
          <path
            className="bloom-stem"
            d={s.d}
            pathLength={100}
            stroke={color.stem}
            strokeWidth={s.back ? 1.6 : 2.4}
            opacity={s.back ? 0.45 : 1}
            style={{ '--d': `${s.delay}ms` } as React.CSSProperties}
          />
          {s.leaves.map((leaf, li) => (
            <g
              key={li}
              transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.rot.toFixed(1)})`}
            >
              <path
                className="bloom-leaf"
                d={leafPath(leaf.len)}
                fill={color.leaf}
                style={{ '--d': `${leaf.delay}ms` } as React.CSSProperties}
              />
            </g>
          ))}
        </g>
      ))}

      {stalks.map((s) =>
        s.asset ? (
          <g key={`flower-${s.key}`}>
            <circle
              className="bloom-glow"
              cx={s.tip.x}
              cy={s.tip.y}
              r={s.size * (s.back ? 0.5 : 0.62)}
              fill={`url(#${uid}-glow)`}
              style={{ '--d': `${s.flowerDelay}ms` } as React.CSSProperties}
            />
            <image
              className="bloom-flower"
              href={s.asset}
              x={s.tip.x - s.size / 2}
              y={s.tip.y - s.size * 0.55}
              width={s.size}
              height={s.size}
              opacity={s.back ? 0.55 : 1}
              preserveAspectRatio="xMidYMid meet"
              style={{ '--d': `${s.flowerDelay}ms` } as React.CSSProperties}
            />
          </g>
        ) : null,
      )}

      {GRASS.filter((b) => b.front).map((b, i) => (
        <path
          key={`gf-${i}`}
          className="bloom-blade"
          d={bladePath(b, BASE_Y)}
          fill={color.grassFront}
          style={{ '--d': `${b.delay}ms`, '--o': 0.85 } as React.CSSProperties}
        />
      ))}

      {MOTES.map((m, i) => (
        <g
          key={`mote-${i}`}
          className="bloom-mote"
          transform={`translate(${m.x} ${m.y}) rotate(${m.r})`}
          style={{ '--d': `${m.delay}ms`, '--rise': m.rise } as React.CSSProperties}
        >
          <path d={motePath(m.s)} fill={i % 3 === 0 ? withAlpha(color.leaf, 0.9) : withAlpha(color.glow, 0.85)} />
        </g>
      ))}
    </svg>
  );
});
BloomArt.displayName = 'BloomArt';

/** Envoltorio ligero: lo único que cambia al florecer es esta clase. */
export const BloomScene: React.FC<BloomSceneProps> = ({ active = true, ...art }) => (
  <div className={`bloom-scene${active ? ' is-running' : ''}`} aria-hidden="true">
    <style>{BLOOM_CSS}</style>
    <BloomArt {...art} />
  </div>
);
