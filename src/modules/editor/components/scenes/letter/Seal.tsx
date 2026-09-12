import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gift, Motif } from '../../../../../components/decor';
import { withAlpha, type ThemePalette } from '../../../../../utils/themePalette';
import type { ThemeDecor } from '../../../../../utils/themeDecor';
import type { Gift as GiftName, GiftPaint } from '../../../../../utils/themeGifts';
import { AUTO_SEAL_DELAY_MS, HOLD_MS, RING_R } from './letterTiming';

interface SealProps {
  /** La firma ya terminó: solo entonces se puede sellar. */
  ready: boolean;
  palette: ThemePalette;
  decor: ThemeDecor;
  paint: GiftPaint;
  gifts: [GiftName, GiftName];
  /** Modo demo: se sella solo, sin que nadie mantenga presionado. */
  auto?: boolean;
}

/**
 * El lacre del final: mantener presionado sella la carta. Un anillo se llena
 * durante la espera y, al completarse, el lacre cae con una vibración corta.
 */
export const Seal: React.FC<SealProps> = ({ ready, palette, decor, paint, gifts, auto = false }) => {
  const [holding, setHolding] = useState(false);
  const [sealed, setSealed] = useState(false);
  const timer = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  const start = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (sealed || !ready) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setHolding(true);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setHolding(false);
        setSealed(true);
        if ('vibrate' in navigator) navigator.vibrate?.(24);
      }, HOLD_MS);
    },
    [ready, sealed],
  );

  useEffect(() => cancel, [cancel]);

  // Modo demo: el lacre se cierra solo, con la misma cuenta del anillo
  useEffect(() => {
    if (!auto || !ready || sealed) return;
    const begin = window.setTimeout(() => setHolding(true), AUTO_SEAL_DELAY_MS);
    const done = window.setTimeout(() => {
      setHolding(false);
      setSealed(true);
    }, AUTO_SEAL_DELAY_MS + HOLD_MS);
    return () => {
      window.clearTimeout(begin);
      window.clearTimeout(done);
    };
  }, [auto, ready, sealed]);

  const restShadow = `drop-shadow(0 9px 11px ${withAlpha(palette.text, 0.3)})`;

  return (
    <div
      className={`seal${ready ? ' is-ready' : ''}${holding ? ' is-holding' : ''}${sealed ? ' is-sealed' : ''}`}
      aria-hidden={!ready}
    >
      <p className="seal__label" style={{ color: palette.text, opacity: 0.7 }}>
        Mantén presionado para sellar
      </p>

      <div className="seal__stage">
        <span className="seal__rest" style={{ backgroundColor: withAlpha(palette.text, 0.18) }} aria-hidden="true" />
        <Gift gift={gifts[0]} paint={paint} size={62} className="seal__gift seal__gift--a" style={{ filter: restShadow }} />

        <button
          type="button"
          className="seal__btn"
          style={{ color: palette.accent }}
          onPointerDown={start}
          onPointerUp={cancel}
          onPointerCancel={cancel}
          onPointerLeave={cancel}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={sealed ? 'Carta sellada' : 'Mantén presionado para sellar la carta'}
          disabled={!ready}
        >
          <span className="seal__spread" style={{ backgroundColor: palette.accent }} aria-hidden="true" />
          <svg className="seal__ring" viewBox="0 0 96 96" aria-hidden="true">
            <circle className="seal__ring-track" cx="48" cy="48" r={RING_R} stroke={withAlpha(decor.metal, 0.35)} />
            <circle className="seal__ring-bar" cx="48" cy="48" r={RING_R} stroke={decor.metal} />
          </svg>
          <span
            className="seal__wax"
            style={{ backgroundColor: palette.accent, border: `2px solid ${withAlpha(decor.metal, 0.75)}` }}
            aria-hidden="true"
          >
            <Motif motif={decor.motif} size={26} color={palette.cardBg} />
          </span>
        </button>

        <Gift gift={gifts[1]} paint={paint} size={54} className="seal__gift seal__gift--b" style={{ filter: restShadow }} />
      </div>

      <p className="seal__done" style={{ color: palette.accent }} aria-live="polite">
        {sealed ? 'tuyo para siempre' : ' '}
      </p>
    </div>
  );
};
