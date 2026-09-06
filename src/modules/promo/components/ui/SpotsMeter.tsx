import React, { useEffect, useRef, useState } from 'react';
import { SPOTS, formatSpots, spotsRatio, spotsTaken } from '../../../../config/campaign';
import { Motif } from '../../../../components/decor';

/** Duración del llenado y del conteo, en ms. */
const FILL_MS = 1400;

/** Suavizado: rápido al principio y frenando al final. */
const easeOut = (t: number): number => 1 - (1 - t) ** 3;

/**
 * Contador lineal de cupos.
 *
 * La barra y el número arrancan cuando la sección entra en pantalla: ver el
 * medidor llenarse comunica la escasez mucho mejor que encontrarlo ya lleno,
 * que se lee como una imagen fija. Con "reducir movimiento" aparece completo
 * de una vez, sin recorrido.
 */
export const SpotsMeter: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let start = 0;

    const run = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / FILL_MS);
      setProgress(easeOut(t));
      if (t < 1) frame = requestAnimationFrame(run);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          frame = requestAnimationFrame(run);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced]);

  const ratio = spotsRatio();
  const taken = spotsTaken();
  const shownTaken = Math.round(taken * progress);
  const shownRemaining = SPOTS.total - shownTaken;

  return (
    <div ref={ref} className={className}>
      <div className="flex items-end justify-between gap-3 mb-2">
        <span className="flex items-baseline gap-1.5">
          {/* tabular-nums: sin esto el ancho baila con cada cifra del conteo */}
          <span className="text-2xl md:text-3xl font-black text-wine tabular-nums">
            {formatSpots(shownRemaining)}
          </span>
          <span className="text-xs font-bold text-wine/70">disponibles</span>
        </span>
        <span className="text-xs font-semibold text-on-surface-variant tabular-nums">
          de {formatSpots(SPOTS.total)}
        </span>
      </div>

      {/* Barra */}
      <div
        className="relative h-3 rounded-full bg-blush ring-1 ring-wine/15 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={SPOTS.total}
        aria-valuenow={taken}
        aria-valuetext={`${formatSpots(SPOTS.remaining)} cupos disponibles de ${formatSpots(SPOTS.total)}`}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-wine-deep via-wine to-primary"
          style={{ width: `${ratio * progress * 100}%` }}
        >
          {/* Rayado de satén, el mismo de la barra superior */}
          <span
            aria-hidden="true"
            className="block h-full w-full opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0 2px, transparent 2px 10px)',
            }}
          />
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-wine/70 pt-2">
        <Motif motif="heart" size={13} color="#8c1128" />
        <span className="tabular-nums font-semibold">{formatSpots(shownTaken)}</span>
        ya reservaron el suyo
      </p>
    </div>
  );
};
