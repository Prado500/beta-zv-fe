import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { THEME_PRESETS } from '../../../editor/types';
import { resolvePalette, withAlpha } from '../../../../utils/themePalette';
import { useMediaQuery } from '../../../../utils/useMediaQuery';

/**
 * Versiones WebP a 360px de las flores del editor. Los PNG originales son de
 * 500px y ~150 KB cada uno: aquí se muestran a ~126px, y descargar 150 KB en
 * el momento de reproducir es lo que hacía que la animación arrancara trabada.
 * El juego completo pasó de 3,6 MB a 393 KB.
 */
const FLOWER_URLS = import.meta.glob('../../../../assets/flores-web/*/flor_*.webp', {
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

const FLOWERS_BY_THEME: Record<string, string[]> = Object.fromEntries(
  THEME_BY_FOLDER.map(([folder, themeId]) => [
    themeId,
    [1, 2, 3]
      .map((n) => FLOWER_URLS[`../../../../assets/flores-web/tema ${folder}/flor_${n}.webp`])
      .filter(Boolean),
  ]),
);

const THEMES = THEME_BY_FOLDER.map(([, id]) => id).filter((id) => FLOWERS_BY_THEME[id]?.length);

/** Debe coincidir con la duración de `.bloom-particle` en index.css. */
const BLOOM_MS = 2800;

interface Particle {
  key: number;
  src: string;
  tx: number;
  ty: number;
  rot: number;
  scale: number;
  delay: number;
  size: number;
}

/** Misma espiral de Fibonacci que usa la carta. */
const buildParticles = (flowers: string[], count: number, stage: number): Particle[] =>
  Array.from({ length: count }, (_, i) => {
    const angle = i * 137.5 * (Math.PI / 180);
    const spread = Math.sqrt(i) * (stage / 4.6);
    return {
      key: i,
      src: flowers[i % flowers.length],
      tx: Math.cos(angle) * spread,
      ty: Math.sin(angle) * spread * 0.82,
      rot: (i * 40) % 360,
      scale: 0.85 + ((Math.sin(i * 999) + 1) / 2) * 0.4,
      delay: (i % 6) * 0.04,
      size: stage * 0.42,
    };
  });

/** Descarga y decodifica antes de animar: si no, el primer frame llega vacío. */
const preload = (sources: string[]): Promise<unknown> =>
  Promise.all(
    sources.map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => undefined);
    }),
  );

export const FlowerShowcase: React.FC = () => {
  const [themeId, setThemeId] = useState(THEMES[0] ?? 'classic');
  const [runId, setRunId] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const runToken = useRef(0);

  const isWide = useMediaQuery('(min-width: 768px)');
  const count = isWide ? 24 : 14;

  const theme = THEME_PRESETS[themeId];
  const palette = resolvePalette(theme);

  const particles = useMemo(() => {
    const flowers = FLOWERS_BY_THEME[themeId] ?? [];
    return playing && flowers.length ? buildParticles(flowers, count, 300) : [];
  }, [playing, themeId, count]);

  /**
   * Espera a que las imágenes estén decodificadas y recién ahí monta las
   * partículas, así el estallido corre completo desde el primer frame.
   */
  const play = useCallback(async (id: string) => {
    const token = ++runToken.current;
    if (timer.current) window.clearTimeout(timer.current);
    setPlaying(false);

    await preload(FLOWERS_BY_THEME[id] ?? []);
    if (runToken.current !== token) return;

    setRunId((n) => n + 1);
    setPlaying(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPlaying(false);
    }, BLOOM_MS);
  }, []);

  // Se dispara solo la primera vez que la pista entra en pantalla
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Con movimiento reducido igual se dispara: ahí la animación es un fundido.

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void play(THEMES[0] ?? 'classic');
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [play]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const pick = (id: string) => {
    setThemeId(id);
    void play(id);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-7">
        <p className="inline-flex items-center gap-1.5 bg-blush text-wine-deep text-[11px] font-bold px-3 py-1.5 rounded-full ring-1 ring-wine/15">
          <span className="material-symbols-outlined text-[15px]">local_florist</span>
          Así estalla al abrirla — toca un estilo
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-5 lg:gap-12 items-center">
        {/* Izquierda: la pista donde corre la animación */}
        <div
          ref={stageRef}
          className="relative w-full max-w-[330px] sm:max-w-[380px] lg:max-w-[420px] mx-auto aspect-square rounded-4xl overflow-hidden shadow-[0_26px_56px_-24px_rgba(94,10,27,0.5)]"
          style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(52% 44% at 50% 46%, ${withAlpha(palette.accent, 0.18)}, transparent 72%)`,
            }}
          />

          {/* Sello central, el punto del que salen las flores */}
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
            style={{ backgroundColor: palette.cardBg, border: `1px solid ${palette.border}` }}
          >
            <span
              className="material-symbols-outlined text-[34px]"
              style={{ color: palette.accent, fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
          </span>

          {/* Partículas: existen solo mientras dura el estallido */}
          <div key={runId} className="absolute inset-0 pointer-events-none">
            {particles.map((p) => (
              <img
                key={p.key}
                src={p.src}
                alt=""
                decoding="async"
                className="bloom-particle absolute left-1/2 top-1/2"
                style={
                  {
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    marginLeft: `${-p.size / 2}px`,
                    marginTop: `${-p.size / 2}px`,
                    '--tx': `${p.tx.toFixed(1)}px`,
                    '--ty': `${p.ty.toFixed(1)}px`,
                    '--rot': `${p.rot}deg`,
                    '--scale': p.scale.toFixed(3),
                    animationDelay: `${p.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-3">
            {/* En móvil el selector no lleva nombres, así que el estilo activo
                se rotula aquí. En escritorio los nombres están en la lista. */}
            <span
              className="lg:hidden rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-black/5 backdrop-blur-sm"
              style={{ backgroundColor: withAlpha(palette.cardBg, 0.9), color: palette.text }}
            >
              {theme.name}
            </span>

            <button
              type="button"
              onClick={() => void play(themeId)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-wine shadow-md ring-1 ring-wine/15 hover:bg-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">replay</span>
              Ver de nuevo
            </button>
          </div>
        </div>

        {/*
          Dos formas del mismo selector.
          Móvil: 4 por fila, solo la flor. Sin los nombres la rejilla mide la
          mitad y la pista cabe junto a ella — antes había que bajar a elegir y
          volver a subir a ver la animación.
          Escritorio: se queda como estaba, en bloques de a dos con su nombre;
          ahí pista y selector ya se ven a la vez y el problema no existe.
        */}
        <ul
          aria-label="Estilos de flores"
          className="grid grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4"
        >
          {THEMES.map((id) => {
            const item = resolvePalette(THEME_PRESETS[id]);
            const active = id === themeId;
            const thumb = FLOWERS_BY_THEME[id]?.[0];
            const name = THEME_PRESETS[id].name;

            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => pick(id)}
                  aria-pressed={active}
                  aria-label={`Estilo ${name}`}
                  title={name}
                  className={`relative w-full overflow-hidden rounded-2xl transition-all cursor-pointer aspect-square lg:aspect-auto lg:h-full lg:flex lg:items-center lg:gap-3 lg:p-2.5 lg:text-left ${
                    active
                      ? 'ring-2 ring-wine shadow-[0_12px_26px_-14px_rgba(140,17,40,0.8)]'
                      : 'ring-1 ring-wine/15 hover:ring-wine/45'
                  }`}
                  style={{ backgroundColor: item.bg }}
                >
                  {/* Halo del acento: en escritorio la casilla es una fila y estorba */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 lg:hidden"
                    style={{
                      background: `radial-gradient(62% 56% at 50% 46%, ${withAlpha(
                        item.accent,
                        0.2,
                      )}, transparent 72%)`,
                    }}
                  />

                  {/* `contents` en móvil: no dibuja caja, la flor llena la casilla */}
                  <span
                    className="contents lg:flex lg:shrink-0 lg:h-12 lg:w-12 lg:items-center lg:justify-center lg:rounded-xl"
                    style={{ backgroundColor: withAlpha(item.accent, 0.12) }}
                  >
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 m-auto w-[76%] h-[76%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)] lg:static lg:m-0 lg:h-9 lg:w-9 lg:drop-shadow-none"
                      />
                    )}
                  </span>

                  <span className="hidden lg:block min-w-0">
                    <span
                      className="block text-xs font-bold leading-tight"
                      style={{ color: item.text }}
                    >
                      {name}
                    </span>
                    <span
                      className="mt-1 inline-block h-1 w-7 rounded-full"
                      style={{ backgroundColor: item.accent, opacity: 0.75 }}
                    />
                  </span>

                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1.5 w-6 rounded-full lg:hidden"
                      style={{ backgroundColor: item.accent }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
