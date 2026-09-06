import React, { useId } from 'react';
import { DECOR_TONE, cleanId, type DecorTone } from './tones';
import { MOTIF_PATHS, isStrokedMotif, motifTransform, type Motif } from '../../utils/themeDecor';

interface OrnamentProps {
  /** Color de la filigrana. Usa "light" sobre fondos oscuros. */
  tone?: DecorTone;
  /** Figura central: los motivos de cada tema, o el rombo neutro. */
  motif?: Motif | 'diamond';
  /** Color explícito; tiene prioridad sobre `tone`. Para seguir un tema. */
  color?: string;
  /**
   * Ancho en px. Se aplica como atributo, no como clase: pasar `w-[124px]` por
   * className chocaba con el `w-[180px]` de base — dos utilidades para la misma
   * propiedad, y gana la que quede después en el CSS, no la que pase quien usa
   * el componente. De ahí que la filigrana saliera descentrada.
   */
  width?: number;
  className?: string;
}

/** Proporción del trazado: 240 de ancho por 18 de alto. */
const RATIO = 18 / 240;

/**
 * Filigrana horizontal: dos hairlines que se desvanecen, dos pétalos
 * y un corazón (o rombo) al centro. Va debajo de los títulos de sección.
 */
export const Ornament: React.FC<OrnamentProps> = ({
  tone = 'gold',
  motif = 'heart',
  color: colorOverride,
  width,
  className = '',
}) => {
  const uid = cleanId(useId());
  const color = colorOverride ?? DECOR_TONE[tone];

  return (
    <svg
      viewBox="0 0 240 18"
      /* Sin ancho explícito conserva el tamaño fluido de las secciones */
      width={width}
      height={width ? Math.round(width * RATIO) : undefined}
      className={`${width ? '' : 'h-[18px] w-[180px] md:w-[240px]'} ${className}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-l`} gradientUnits="userSpaceOnUse" x1="4" y1="9" x2="96" y2="9">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${uid}-r`} gradientUnits="userSpaceOnUse" x1="144" y1="9" x2="236" y2="9">
          <stop offset="0" stopColor={color} stopOpacity="0.75" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d="M4 9 H96" stroke={`url(#${uid}-l)`} strokeWidth="1" strokeLinecap="round" />
      <path d="M144 9 H236" stroke={`url(#${uid}-r)`} strokeWidth="1" strokeLinecap="round" />

      <circle cx="101" cy="9" r="1.1" fill={color} fillOpacity="0.55" />
      <circle cx="139" cy="9" r="1.1" fill={color} fillOpacity="0.55" />

      {/* Pétalos laterales, con simetría rotacional */}
      <path
        d="M106 9 C106 4.8 108.7 2.6 112 2.6 C112 6.6 109.4 9 106 9 Z"
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M134 9 C134 13.2 131.3 15.4 128 15.4 C128 11.4 130.6 9 134 9 Z"
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {motif === 'diamond' ? (
        <path
          d="M120 3 L125 9 L120 15 L115 9 Z"
          stroke={color}
          strokeOpacity="0.9"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ) : (
        /* El motivo vive en una caja de 48; se encoge al centro de la cinta */
        <g
          transform={motifTransform(motif, 13, 120, 9)}
          fill={isStrokedMotif(motif) ? 'none' : color}
          stroke={isStrokedMotif(motif) ? color : 'none'}
          color={color}
          dangerouslySetInnerHTML={{ __html: MOTIF_PATHS[motif] }}
        />
      )}
    </svg>
  );
};
