/**
 * Descubrir los recuerdos: dónde se posan las fotos y cuánto dura cada paso.
 *
 * Lo comparten la previa de React (`scenes/MemoriesScene.tsx`) y el HTML que
 * se descarga (`utils/export`), para que las dos versiones repartan las fotos
 * en el mismo sitio. Aquí no hay nada de React a propósito.
 */

export interface Spot {
  dx: number;
  dy: number;
  rot: number;
}

/** Esparcido inicial por cantidad de fotos, en px desde el centro (320×640). */
export const SCATTER: Record<number, Spot[]> = {
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
export const FAN: Record<number, Spot[]> = {
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
export const WIDTH: Record<number, number> = { 1: 190, 2: 150, 3: 134, 4: 126, 5: 118 };
export const FAN_SCALE: Record<number, number> = { 1: 1, 2: 0.92, 3: 0.9, 4: 0.84, 5: 0.8 };

export const MEM_ENTER_MS = 600;
export const MEM_ENTER_STAGGER_MS = 100;
export const MEM_BURST_MS = 650;
/** Tras la última revelación: espera al brote, abanica, aguanta, se va. */
export const MEM_SETTLE_AT_MS = 500;
export const MEM_SETTLE_MS = 700;
export const MEM_LEAVE_AT_MS = MEM_SETTLE_AT_MS + MEM_SETTLE_MS + 300;
export const MEM_LEAVE_MS = 420;

export const MEM_BURST_COUNT = 7;

/** Desfase del parpadeo entre fotos, para que no laten todas al tiempo. */
export const MEM_BEAT_STAGGER_MS = 320;

/** Máximo de fotos que la escena reparte. */
export const MEM_MAX = 5;

export const spotTransform = ({ dx, dy, rot }: Spot, scale: number): string =>
  `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(${scale})`;

/** El puñado de motivos que brota alrededor de la foto recién descubierta. */
export const memBurst = (
  width: number,
  accent: string,
  metal: string,
): { dx: string; dy: string; rot: string; color: string; size: number }[] =>
  Array.from({ length: MEM_BURST_COUNT }, (_, i) => {
    const a = ((i * 360) / MEM_BURST_COUNT - 90) * (Math.PI / 180);
    const r = width * 0.62 + (i % 2) * 10;
    return {
      dx: `${(Math.cos(a) * r).toFixed(1)}px`,
      dy: `${(Math.sin(a) * r).toFixed(1)}px`,
      rot: `${(i % 2 ? -1 : 1) * (40 + i * 9)}deg`,
      color: i % 2 ? metal : accent,
      size: 11 + (i % 3) * 3,
    };
  });

/** Las medidas que le tocan a un grupo de n fotos. */
export const memLayout = (n: number) => ({
  spots: SCATTER[n] ?? SCATTER[MEM_MAX],
  fan: FAN[n] ?? FAN[MEM_MAX],
  width: WIDTH[n] ?? WIDTH[MEM_MAX],
  fanScale: FAN_SCALE[n] ?? FAN_SCALE[MEM_MAX],
});

/* Ojo con los acentos graves aquí dentro: cierran la plantilla antes de tiempo. */
export const MEM_CSS = `
.mem-scene {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  z-index: 45;
  overflow: hidden;
}
.mem-scene.is-leaving { animation: memLeave ${MEM_LEAVE_MS}ms var(--ease) forwards; pointer-events: none; }
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
  transition: transform ${MEM_SETTLE_MS}ms var(--ease);
  will-change: transform;
}
.mem-photo:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 4px; }
.mem-photo.is-revealed { cursor: default; }

.mem-photo__inner {
  opacity: 0;
  animation: memIn ${MEM_ENTER_MS}ms var(--ease) var(--d) forwards;
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
  animation: memBurst ${MEM_BURST_MS}ms var(--ease) forwards;
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
