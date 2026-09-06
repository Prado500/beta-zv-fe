import React from 'react';
import {
  MOTIF_PATHS,
  isStrokedMotif,
  motifViewBox,
  type Motif as MotifName,
} from '../../utils/themeDecor';

interface MotifProps {
  motif: MotifName;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * El símbolo del tema: corazón, pétalos, estrella, sol, destello, hoja, luna
 * o mariposa. Se usa en el lacre de la carta y en el centro de la filigrana.
 */
export const Motif: React.FC<MotifProps> = ({
  motif,
  size = 20,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    viewBox={motifViewBox(motif)}
    width={size}
    height={size}
    fill={isStrokedMotif(motif) ? 'none' : color}
    stroke={isStrokedMotif(motif) ? color : 'none'}
    color={color}
    className={className}
    aria-hidden="true"
    focusable="false"
    dangerouslySetInnerHTML={{ __html: MOTIF_PATHS[motif] }}
  />
);
