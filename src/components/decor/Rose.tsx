import React from 'react';

interface RoseProps {
  /** Lado en px. */
  size?: number;
  /** Rojo del pétalo. */
  color?: string;
  /** Verde del tallo y las hojas. */
  leaf?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Rosa dibujada en espiral con tallo y dos hojas. Vector puro: escala sin
 * pixelarse y no suma peso al bundle.
 */
export const Rose: React.FC<RoseProps> = ({
  size = 120,
  color = '#8c1128',
  leaf = '#6b7f5c',
  className = '',
  style,
}) => (
  <svg
    viewBox="0 0 120 200"
    width={size}
    height={(size / 120) * 200}
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
    style={style}
  >
    {/* Tallo */}
    <path d="M60 78 C63 118 61 152 57 192" stroke={leaf} strokeWidth="3.5" strokeLinecap="round" />

    {/* Hojas */}
    <path
      d="M61 118 C78 110 92 116 99 128 C84 138 68 134 61 118 Z"
      fill={leaf}
      fillOpacity="0.85"
    />
    <path d="M63 120 C76 120 87 124 96 129" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
    <path
      d="M59 146 C42 140 28 147 22 160 C38 168 53 162 59 146 Z"
      fill={leaf}
      fillOpacity="0.7"
    />
    <path d="M57 148 C45 149 34 154 26 160" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />

    {/* Sépalos */}
    <path d="M60 80 C50 78 44 70 43 60 C52 64 58 71 60 80 Z" fill={leaf} fillOpacity="0.9" />
    <path d="M60 80 C70 78 76 70 77 60 C68 64 62 71 60 80 Z" fill={leaf} fillOpacity="0.9" />

    {/* Capullo: pétalos exteriores hacia el centro */}
    <path
      d="M60 12 C88 12 106 32 106 54 C106 72 86 84 60 84 C34 84 14 72 14 54 C14 32 32 12 60 12 Z"
      fill={color}
    />
    <path
      d="M60 20 C82 20 96 36 96 53 C96 68 80 78 60 78 C40 78 24 68 24 53 C24 36 38 20 60 20 Z"
      fill="#ffffff"
      fillOpacity="0.1"
    />
    <path
      d="M60 28 C76 28 87 40 87 52 C87 63 75 71 60 71 C45 71 33 63 33 52 C33 40 44 28 60 28 Z"
      fill="#000000"
      fillOpacity="0.12"
    />
    {/* Espiral del corazón de la rosa */}
    <path
      d="M75 52 C75 44 68 38 60 38 C51 38 45 45 45 53 C45 60 51 65 58 65 C64 65 68 61 68 55 C68 50 64 47 60 47 C57 47 54 50 54 53"
      stroke="#ffffff"
      strokeOpacity="0.42"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);
