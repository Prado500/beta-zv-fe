import React, { useEffect, useRef, useState } from 'react';
import { SIGN_FILL_AT_MS, SIGN_FILL_MS } from './letterTiming';

interface SignatureProps {
  name: string;
  color: string;
  /** Contenedor con scroll, raíz del IntersectionObserver. */
  root: React.RefObject<HTMLDivElement | null>;
  onSigned: () => void;
}

const SIG_MAX_W = 260;
const SIG_FONT = 40;
const SIG_H = 64;

/**
 * La firma se escribe sola cuando entra a la vista: `<text>` SVG en script
 * con `stroke-dasharray`, y luego aparece el relleno. Avisa con `onSigned`
 * cuando termina, que es cuando el lacre se puede tocar.
 */
export const Signature: React.FC<SignatureProps> = ({ name, color, root, onSigned }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const [fontSize, setFontSize] = useState(SIG_FONT);
  const [len, setLen] = useState(2400);
  const [writing, setWriting] = useState(false);
  const onSignedRef = useRef(onSigned);
  useEffect(() => {
    onSignedRef.current = onSigned;
  }, [onSigned]);

  // Mide con la fuente real cargada: ajusta el tamaño a nombres largos y
  // deriva el largo del trazo (el contorno de una script ronda 7× el avance).
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const el = textRef.current;
      // jsdom no mide texto SVG: se queda con el tamaño de diseño.
      if (!el || cancelled || typeof el.getComputedTextLength !== 'function') return;
      const w = el.getComputedTextLength();
      if (!w) return;
      const size = w > SIG_MAX_W ? Math.max(22, (SIG_FONT * SIG_MAX_W) / w) : SIG_FONT;
      setFontSize(size);
      setLen(Math.ceil(Math.min(w, SIG_MAX_W) * 7.5 + 200));
    };
    if (document.fonts?.ready) {
      void document.fonts.ready.then(measure);
    } else {
      measure();
    }
    return () => {
      cancelled = true;
    };
  }, [name]);

  // Arranca al entrar a la vista. Donde no hay observador (jsdom) se escribe al montar.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || writing) return;
    if (typeof IntersectionObserver === 'undefined') {
      const t = window.setTimeout(() => setWriting(true), 250);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          window.setTimeout(() => setWriting(true), 250);
        }
      },
      { root: root.current, threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [root, writing]);

  useEffect(() => {
    if (!writing) return;
    const t = window.setTimeout(() => onSignedRef.current(), SIGN_FILL_AT_MS + SIGN_FILL_MS);
    return () => window.clearTimeout(t);
  }, [writing]);

  return (
    <div ref={wrapRef} className={writing ? 'is-writing' : ''}>
      <svg
        className="sign__svg"
        viewBox={`0 0 ${SIG_MAX_W} ${SIG_H}`}
        width={SIG_MAX_W}
        height={SIG_H}
        style={{ maxWidth: '100%', '--len': len } as React.CSSProperties}
        aria-label={name}
        role="img"
      >
        <text
          ref={textRef}
          className="sig-text sig-stroke"
          x={SIG_MAX_W}
          y={SIG_H - 16}
          textAnchor="end"
          fontSize={fontSize}
          stroke={color}
        >
          {name}
        </text>
        <text
          className="sig-text sig-fill"
          x={SIG_MAX_W}
          y={SIG_H - 16}
          textAnchor="end"
          fontSize={fontSize}
          fill={color}
        >
          {name}
        </text>
      </svg>
    </div>
  );
};
