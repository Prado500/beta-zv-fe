import React from 'react';
import { DECOR_TONE, type DecorTone } from './tones';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

interface CornerFlourishProps {
  corner?: Corner;
  tone?: DecorTone;
  /** Lado del cuadro en px. */
  size?: number;
  /** Reemplaza la posición por defecto (p. ej. "-top-3 -left-3"). */
  placement?: string;
  /** Color explícito; tiene prioridad sobre `tone`. Para seguir un tema. */
  color?: string;
  className?: string;
}

const POSITION: Record<Corner, string> = {
  tl: 'top-4 left-4',
  tr: 'top-4 right-4',
  br: 'bottom-4 right-4',
  bl: 'bottom-4 left-4',
};

const ROTATION: Record<Corner, string> = {
  tl: '',
  tr: 'rotate-90',
  br: 'rotate-180',
  bl: '-rotate-90',
};

/**
 * Enredadera fina para las esquinas de las tarjetas. Decorativa y sin
 * eventos: se monta con position absolute dentro de un contenedor relative.
 */
export const CornerFlourish: React.FC<CornerFlourishProps> = ({
  corner = 'tl',
  tone = 'gold',
  size = 64,
  placement,
  color: colorOverride,
  className = '',
}) => {
  const color = colorOverride ?? DECOR_TONE[tone];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute ${placement ?? POSITION[corner]} ${ROTATION[corner]} ${className}`}
    >
      <path
        d="M2 40 C2 19 19 2 40 2"
        stroke={color}
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M9 40 C9 23 23 9 40 9"
        stroke={color}
        strokeOpacity="0.3"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {/* Hoja apoyada sobre la curva */}
      <path
        d="M20 14 C24 9 30 8 34 9 C31 14 25 16 20 14 Z"
        stroke={color}
        strokeOpacity="0.45"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="2" r="1.4" fill={color} fillOpacity="0.5" />
      <circle cx="2" cy="40" r="1.4" fill={color} fillOpacity="0.5" />
    </svg>
  );
};
