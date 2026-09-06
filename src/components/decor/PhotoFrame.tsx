import React from 'react';

interface PhotoFrameProps {
  children: React.ReactNode;
  /** Pie de foto manuscrito, como en un álbum. */
  caption?: string;
  /** Inclinación en grados. Valores chicos (-3 a 3) se ven naturales. */
  tilt?: number;
  /** Cinta washi en una esquina superior. */
  tape?: 'left' | 'right' | 'none';
  className?: string;
}

/**
 * Marco tipo polaroid: borde blanco grueso, sombra suave, ligera
 * inclinación y cinta washi. Envuelve fotos, videos o GIFs.
 */
export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  children,
  caption,
  tilt = -2,
  tape = 'left',
  className = '',
}) => (
  <div className={`relative ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
    {tape !== 'none' && (
      <div
        className={`absolute -top-3 z-20 h-7 w-24 bg-blush/80 border border-white/60 shadow-sm backdrop-blur-[1px] ${
          tape === 'left' ? '-left-2 -rotate-6' : '-right-2 rotate-6'
        }`}
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(140,17,40,0.12) 0 3px, transparent 3px 9px)',
        }}
        aria-hidden="true"
      ></div>
    )}

    <div className="bg-white rounded-2xl p-3 pb-4 shadow-[0_18px_40px_-14px_rgba(94,10,27,0.35)] ring-1 ring-wine/10">
      <div className="overflow-hidden rounded-xl bg-paper-deep">{children}</div>
      {caption && (
        <p className="font-script text-wine/80 text-2xl leading-none text-center pt-3">{caption}</p>
      )}
    </div>
  </div>
);
