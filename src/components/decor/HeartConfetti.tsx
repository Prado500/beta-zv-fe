import React, { useMemo } from 'react';
import { DECOR_TONE, type DecorTone } from './tones';

interface HeartConfettiProps {
  /** Cantidad de corazones. 10-14 para una sección, 24+ para el fondo global. */
  count?: number;
  tone?: DecorTone;
  /** Opacidad máxima de la capa. */
  opacity?: number;
  /**
   * Flotación suave. Apagada por defecto: cada corazón animado es una capa de
   * compositor viva permanentemente, y con ~100 en la página el scroll se traba.
   */
  float?: boolean;
  /** position: fixed en vez de absolute, para la capa global de la página. */
  fixed?: boolean;
  className?: string;
}

/** PRNG determinista: mismo layout en cada render y en cada recarga. */
const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

const HEART_PATH =
  'M12 21 C5.4 16.2 2 13.2 2 9.2 C2 6 4.5 3.5 7.6 3.5 C9.4 3.5 11.1 4.4 12 5.8 C12.9 4.4 14.6 3.5 16.4 3.5 C19.5 3.5 22 6 22 9.2 C22 13.2 18.6 16.2 12 21 Z';

/**
 * Lluvia de corazoncitos regados por el fondo, como el papel de una carta.
 * Puramente decorativa: no captura eventos ni entra al orden de lectura.
 */
export const HeartConfetti: React.FC<HeartConfettiProps> = ({
  count = 14,
  tone = 'rose',
  opacity = 0.16,
  float = false,
  fixed = false,
  className = '',
}) => {
  const color = DECOR_TONE[tone];

  const hearts = useMemo(() => {
    const rand = seeded(count * 7919 + 104729);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: rand() * 96 + 2,
      top: rand() * 94 + 3,
      size: 9 + rand() * 15,
      rotate: rand() * 70 - 35,
      alpha: 0.45 + rand() * 0.55,
      outline: rand() > 0.62,
      delay: rand() * 6,
      duration: 6 + rand() * 5,
    }));
  }, [count]);

  return (
    <div
      className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {hearts.map((h) => (
        <svg
          key={h.key}
          viewBox="0 0 24 24"
          width={h.size}
          height={h.size}
          className={`absolute ${float ? 'animate-float-soft' : ''}`}
          style={{
            left: `${h.left}%`,
            top: `${h.top}%`,
            transform: `rotate(${h.rotate}deg)`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
          }}
        >
          <path
            d={HEART_PATH}
            fill={h.outline ? 'none' : color}
            fillOpacity={h.alpha}
            stroke={h.outline ? color : 'none'}
            strokeOpacity={h.alpha}
            strokeWidth={h.outline ? 1.8 : 0}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
};
