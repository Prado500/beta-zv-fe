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
    <path d="M60 84 C64 120 62 156 58 192" stroke={leaf} strokeWidth="4.5" strokeLinecap="round" />

    {/* Hojas */}
    <path
      d="M62 122 C79 112 95 118 103 132 C87 143 68 139 62 122 Z"
      fill={leaf}
      fillOpacity="0.85"
    />
    <path d="M64 124 C77 124 90 128 100 133" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M59 152 C42 144 26 151 18 165 C34 176 53 169 59 152 Z"
      fill={leaf}
      fillOpacity="0.7"
    />
    <path d="M57 154 C45 155 32 160 22 166" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" />

    {/*
      Capullo. La silueta va lobulada, no elíptica: con una elipse lisa la flor
      se leía como una paleta de caramelo, sobre todo al 25% de opacidad, que
      es como aparece de fondo.
    */}
    <path
      d="M60 12
         C73 12 83 18 87 27
         C97 30 102 42 98 52
         C102 63 93 77 81 78
         C74 85 46 85 39 78
         C27 77 18 63 22 52
         C18 42 23 30 33 27
         C37 18 47 12 60 12 Z"
      fill={color}
    />
    {/* Luz arriba y sombra abajo, para que el capullo tenga volumen */}
    <path
      d="M60 17 C73 17 83 24 87 33 C77 26 69 23 60 23 C51 23 43 26 33 33 C37 24 47 17 60 17 Z"
      fill="#ffffff"
      fillOpacity="0.16"
    />
    <path
      d="M25 58 C33 72 45 80 60 80 C75 80 87 72 95 58 C93 74 79 84 60 84 C41 84 27 74 25 58 Z"
      fill="#000000"
      fillOpacity="0.14"
    />
    {/* Espiral del corazón, centrada en el capullo */}
    <path
      d="M82 48 C82 36 72 26 60 26 C47 26 37 36 37 49 C37 60 46 69 57 69 C66 69 73 62 73 54 C73 46 67 41 60 41 C55 41 51 45 51 50"
      stroke="#ffffff"
      strokeOpacity="0.45"
      strokeWidth="2.6"
      strokeLinecap="round"
    />

    {/* Sépalos: por delante del capullo, si no quedan tapados */}
    <path d="M51 76 C48 84 44 89 37 92 C41 83 45 78 51 76 Z" fill={leaf} fillOpacity="0.9" />
    <path d="M69 76 C72 84 76 89 83 92 C79 83 75 78 69 76 Z" fill={leaf} fillOpacity="0.9" />
    <path d="M60 79 C59 86 58 91 57 96 C55 89 56 83 60 79 Z" fill={leaf} fillOpacity="0.85" />
  </svg>
);
