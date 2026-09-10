import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Motif } from '../../../../components/decor';
import { withAlpha, type ThemePalette } from '../../../../utils/themePalette';
import type { ThemeDecor } from '../../../../utils/themeDecor';

/**
 * Momento 4: descubrir los recuerdos.
 *
 * Las fotos llegan veladas y esparcidas. Cada toque revela una: la capa velada
 * (desaturada y con un desenfoque leve, un `filter` estático) se funde a
 * opacidad 0 sobre la foto a color, y alrededor brota un puñado de motivos del
 * tema. Al descubrir la última, las polaroids se abanican en el centro y la
 * escena da paso a la carta.
 *
 * Todas las posiciones son `transform` desde el centro de la pantalla — nunca
 * left/top — así el acomodo final es una transición de `transform` y nada más.
 * Con `photos` vacío, PhonePreview no monta esta escena.
 */

interface Spot {
  dx: number;
  dy: number;
  rot: number;
}

/** Esparcido inicial por cantidad de fotos, en px desde el centro (320×640). */
const SCATTER: Record<number, Spot[]> = {
  1: [{ dx: 0, dy: -10, rot: -4 }],
  2: [
    { dx: -46, dy: -72, rot: -7 },
    { dx: 48, dy: 62, rot: 6 },
  ],
  3: [
    { dx: -58, dy: -112, rot: -8 },
    { dx: 60, dy: -18, rot: 6 },
    { dx: -30, dy: 102, rot: -4 },
  ],
  4: [
    { dx: -60, dy: -122, rot: -7 },
    { dx: 62, dy: -68, rot: 5 },
    { dx: -52, dy: 42, rot: 4 },
    { dx: 58, dy: 122, rot: -6 },
  ],
  5: [
    { dx: -64, dy: -152, rot: -8 },
    { dx: 60, dy: -108, rot: 6 },
    { dx: -40, dy: -8, rot: -3 },
    { dx: 66, dy: 52, rot: 7 },
    { dx: -56, dy: 142, rot: -5 },
  ],
};

/** Abanico final: como una mano de cartas, la del centro arriba. */
const FAN: Record<number, Spot[]> = {
  1: [{ dx: 0, dy: 0, rot: 0 }],
  2: [
    { dx: -44, dy: 0, rot: -8 },
    { dx: 44, dy: 0, rot: 8 },
  ],
  3: [
    { dx: -54, dy: 4, rot: -11 },
    { dx: 0, dy: -8, rot: 0 },
    { dx: 54, dy: 4, rot: 11 },
  ],
  4: [
    { dx: -70, dy: 6, rot: -13 },
    { dx: -24, dy: -6, rot: -4 },
    { dx: 24, dy: -6, rot: 4 },
    { dx: 70, dy: 6, rot: 13 },
  ],
  5: [
    { dx: -86, dy: 8, rot: -15 },
    { dx: -44, dy: -4, rot: -7 },
    { dx: 0, dy: -10, rot: 0 },
    { dx: 44, dy: -4, rot: 7 },
    { dx: 86, dy: 8, rot: 15 },
  ],
};

/** Ancho de la polaroid por cantidad; y a cuánto se encoge en el abanico. */
const WIDTH: Record<number, number> = { 1: 190, 2: 150, 3: 134, 4: 126, 5: 118 };
const FAN_SCALE: Record<number, number> = { 1: 1, 2: 0.92, 3: 0.9, 4: 0.84, 5: 0.8 };

const ENTER_MS = 600;
const ENTER_STAGGER_MS = 100;
const BURST_MS = 650;
/** Tras la última revelación: espera al brote, abanica, aguanta, se va. */
const SETTLE_AT_MS = 500;
const SETTLE_MS = 700;
const LEAVE_AT_MS = SETTLE_AT_MS + SETTLE_MS + 300;
const LEAVE_MS = 420;

const BURST_COUNT = 7;

const spotTransform = ({ dx, dy, rot }: Spot, scale: number): string =>
  `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(${scale})`;

const CSS = `
.mem-scene {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  z-index: 45;
  overflow: hidden;
}
.mem-scene.is-leaving { animation: memLeave ${LEAVE_MS}ms var(--ease) forwards; pointer-events: none; }
.mem-scene.is-settling { pointer-events: none; }

.mem-photo {
  position: absolute;
  left: 50%;
  top: 50%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform ${SETTLE_MS}ms var(--ease);
  will-change: transform;
}
.mem-photo:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 4px; }
.mem-photo.is-revealed { cursor: default; }

.mem-photo__inner {
  opacity: 0;
  animation: memIn ${ENTER_MS}ms var(--ease) var(--d) forwards;
}
.mem-photo__frame {
  background: #fff;
  padding: 6px 6px 18px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.4);
}
.is-revealed .mem-photo__frame { animation: memPop 480ms var(--ease) forwards; }

/* Parpadeo de las que faltan: late el marco y el velo se aclara un punto, para
   que se lea que hay algo debajo esperando. Escalonado, no todas a la vez. */
.mem-photo:not(.is-revealed) .mem-photo__frame {
  animation: memBeckon 2.4s var(--ease) var(--beat) infinite;
}
.mem-photo:not(.is-revealed) .mem-photo__veil {
  animation: memBlink 2.4s var(--ease) var(--beat) infinite;
}
@keyframes memBeckon {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.035); }
}
@keyframes memBlink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.72; }
}
.mem-photo__pic {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #eee;
  border-radius: 2px;
}
.mem-photo__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}
/* Velo: desaturado y desenfocado. El filter es estático; lo que se anima es su opacidad */
.mem-photo__veil {
  filter: grayscale(1) blur(2.5px) brightness(1.04);
  transform: scale(1.08);
  transition: opacity 520ms var(--ease);
}
.is-revealed .mem-photo__veil { opacity: 0; }

/* Brote alrededor de la foto descubierta */
.mem-burst {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 2;
}
.mem-burst__p {
  position: absolute;
  left: 0;
  top: 0;
  line-height: 0;
  opacity: 0;
  animation: memBurst ${BURST_MS}ms var(--ease) forwards;
}

.mem-hint {
  position: absolute;
  left: 50%;
  bottom: 34px;
  transform: translateX(-50%);
  margin: 0;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;
  animation: memHintIn 500ms var(--ease) 500ms forwards;
}
.is-started .mem-hint { animation: memFade 300ms var(--ease) forwards; }

@keyframes memIn {
  from { opacity: 0; transform: translateY(14px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes memPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}
@keyframes memBurst {
  0%   { transform: translate(-50%, -50%) scale(0.2) rotate(0deg); opacity: 0; }
  25%  { opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1) rotate(var(--r)); opacity: 0; }
}
@keyframes memHintIn { to { opacity: 0.85; } }
@keyframes memFade { to { opacity: 0; } }
@keyframes memLeave { to { opacity: 0; } }

/* "Reducir movimiento": la escena se vive igual (es interactiva); sólo se
   apaga el parpadeo de invitación, que es lo que late sin parar. */
@media (prefers-reduced-motion: reduce) {
  .mem-photo:not(.is-revealed) .mem-photo__frame,
  .mem-photo:not(.is-revealed) .mem-photo__veil { animation: none; }
}
`;

/** Desfase del parpadeo entre fotos, para que no laten todas al tiempo. */
const BEAT_STAGGER_MS = 320;

interface MemoriesSceneProps {
  /** Hasta 5 fotos; con 0 no debe montarse. */
  photos: string[];
  palette: ThemePalette;
  decor: ThemeDecor;
  onDone: () => void;
}

/**
 * Descubrir las fotos es el momento interactivo de la carta: se descubren
 * tocándolas, siempre — también en modo demo. Lo único que hace la escena por
 * su cuenta es llamar la atención con un parpadeo.
 */
export const MemoriesScene: React.FC<MemoriesSceneProps> = ({ photos, palette, decor, onDone }) => {
  const list = useMemo(() => photos.slice(0, 5), [photos]);
  const n = list.length;
  const [revealed, setRevealed] = useState<boolean[]>(() => list.map(() => false));
  const [stage, setStage] = useState<'discover' | 'settle' | 'leave'>('discover');
  const timers = useRef<number[]>([]);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const allRevealed = n > 0 && revealed.every(Boolean);
  const started = revealed.some(Boolean);

  useEffect(() => {
    if (!allRevealed) return;
    timers.current.push(
      window.setTimeout(() => setStage('settle'), SETTLE_AT_MS),
      window.setTimeout(() => setStage('leave'), LEAVE_AT_MS),
      window.setTimeout(() => onDoneRef.current(), LEAVE_AT_MS + LEAVE_MS),
    );
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [allRevealed]);

  const reveal = (i: number) => {
    if (stage !== 'discover' || revealed[i]) return;
    setRevealed((prev) => prev.map((r, idx) => (idx === i ? true : r)));
  };


  const spots = SCATTER[n] ?? SCATTER[5];
  const fan = FAN[n] ?? FAN[5];
  const width = WIDTH[n] ?? WIDTH[5];
  const fanScale = FAN_SCALE[n] ?? FAN_SCALE[5];
  const settled = stage !== 'discover';
  const mid = (n - 1) / 2;

  const burst = useMemo(
    () =>
      Array.from({ length: BURST_COUNT }, (_, i) => {
        const a = ((i * 360) / BURST_COUNT - 90) * (Math.PI / 180);
        const r = width * 0.62 + (i % 2) * 10;
        return {
          dx: `${(Math.cos(a) * r).toFixed(1)}px`,
          dy: `${(Math.sin(a) * r).toFixed(1)}px`,
          rot: `${(i % 2 ? -1 : 1) * (40 + i * 9)}deg`,
          color: i % 2 ? decor.metal : palette.accent,
          size: 11 + (i % 3) * 3,
        };
      }),
    [width, decor.metal, palette.accent],
  );

  return (
    <div
      className={`mem-scene${started ? ' is-started' : ''}${stage === 'settle' ? ' is-settling' : ''}${
        stage === 'leave' ? ' is-leaving' : ''
      }`}
    >
      <style>{CSS}</style>

      {list.map((src, i) => {
        const spot = settled ? fan[i] : spots[i];
        const isRevealed = revealed[i];
        return (
          <button
            key={i}
            type="button"
            className={`mem-photo${isRevealed ? ' is-revealed' : ''}`}
            style={
              {
                width,
                transform: spotTransform(spot, settled ? fanScale : 1),
                zIndex: settled ? 10 + n - Math.abs(i - mid) : 10 + i,
                color: palette.accent,
                '--beat': `${i * BEAT_STAGGER_MS}ms`,
              } as React.CSSProperties
            }
            onClick={() => reveal(i)}
            aria-label={isRevealed ? `Recuerdo ${i + 1} descubierto` : `Descubrir recuerdo ${i + 1}`}
            aria-pressed={isRevealed}
          >
            <span
              className="mem-photo__inner"
              style={{ '--d': `${i * ENTER_STAGGER_MS}ms`, display: 'block' } as React.CSSProperties}
            >
              <span className="mem-photo__frame" style={{ display: 'block' }}>
                <span className="mem-photo__pic" style={{ display: 'block' }}>
                  <img className="mem-photo__img" src={src} alt="" draggable={false} />
                  <img className="mem-photo__img mem-photo__veil" src={src} alt="" draggable={false} aria-hidden="true" />
                </span>
              </span>
            </span>

            {isRevealed && (
              <span className="mem-burst" aria-hidden="true">
                {burst.map((p, pi) => (
                  <span
                    key={pi}
                    className="mem-burst__p"
                    style={{ '--dx': p.dx, '--dy': p.dy, '--r': p.rot } as React.CSSProperties}
                  >
                    <Motif motif={decor.motif} size={p.size} color={p.color} />
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}

      <p
        className="mem-hint"
        style={{ color: palette.text, backgroundColor: withAlpha(palette.cardBg, 0.8) }}
      >
        Toca para descubrir
      </p>
    </div>
  );
};
