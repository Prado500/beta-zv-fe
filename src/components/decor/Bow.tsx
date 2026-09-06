import React from 'react';

interface BowProps {
  /** Ancho en px. */
  size?: number;
  color?: string;
  /** Color del brillo del satén. */
  sheen?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lazo de satén con dos cintas colgando. Va sobre las tarjetas, como un
 * moño puesto encima del regalo.
 */
export const Bow: React.FC<BowProps> = ({
  size = 96,
  color = '#a11228',
  sheen = '#d4536a',
  className = '',
  style,
}) => (
  <svg
    viewBox="0 0 120 96"
    width={size}
    height={(size / 120) * 96}
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
    style={style}
  >
    {/* Cintas colgando */}
    <path d="M52 40 C46 58 40 72 28 90 L44 86 L50 94 C56 74 58 56 58 44 Z" fill={color} fillOpacity="0.92" />
    <path d="M68 40 C74 58 80 72 92 90 L76 86 L70 94 C64 74 62 56 62 44 Z" fill={color} fillOpacity="0.8" />

    {/* Lazadas */}
    <path
      d="M56 36 C46 18 28 10 16 18 C4 26 8 44 24 48 C36 51 48 46 56 38 Z"
      fill={color}
    />
    <path
      d="M64 36 C74 18 92 10 104 18 C116 26 112 44 96 48 C84 51 72 46 64 38 Z"
      fill={color}
      fillOpacity="0.88"
    />
    <path d="M48 26 C38 20 28 19 21 23" stroke={sheen} strokeOpacity="0.65" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M72 26 C82 20 92 19 99 23" stroke={sheen} strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round" />

    {/* Nudo */}
    <ellipse cx="60" cy="38" rx="10" ry="9" fill={color} />
    <path d="M55 34 C57 32 61 31 64 33" stroke={sheen} strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
