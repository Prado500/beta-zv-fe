import React, { useMemo } from 'react';

/**
 * El estallido de flores que cubre la pantalla.
 *
 * Es la animación original del producto, recuperada como escena propia: 32
 * flores del tema que brotan desde el centro, se abren por toda la pantalla y
 * se disuelven. Va después de descubrir los recuerdos, como último paso antes
 * de la carta.
 *
 * El reparto es una espiral áurea (137,5° entre flores) con radios que crecen
 * como la raíz del índice: así se llena el centro y los bordes por igual sin
 * que dos flores caigan en el mismo sitio. Las posiciones son fijas, no
 * aleatorias, para que cada apertura se vea igual.
 */

/** Duración total; PhonePreview espera esto antes de mostrar la carta. */
export const FLOWER_BURST_MS = 2600;

const COUNT = 32;

const CSS = `
.burst-scene {
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  z-index: 46;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
}
.burst-flower {
  position: absolute;
  width: 128px;
  height: 128px;
  opacity: 0;
  will-change: transform, opacity;
  backface-visibility: hidden;
  animation: burstOpen ${FLOWER_BURST_MS}ms var(--ease) var(--d) forwards;
}
.burst-flower img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
}

@keyframes burstOpen {
  0%   { transform: translate3d(0, 0, 0) scale(0) rotate(calc(var(--rot) - 20deg)); opacity: 0; }
  25%  { transform: translate3d(var(--tx), var(--ty), 0) scale(var(--scale)) rotate(var(--rot)); opacity: 1; }
  65%  { transform: translate3d(var(--tx), var(--ty), 0) scale(var(--scale)) rotate(var(--rot)); opacity: 1; }
  100% { transform: translate3d(calc(var(--tx) * 1.05), calc(var(--ty) * 1.05), 0)
                   scale(calc(var(--scale) * 1.05)) rotate(calc(var(--rot) + 10deg)); opacity: 0; }
}

/* El estallido se muestra también con "Reducir movimiento": es la escena. */
`;

interface FlowerBurstSceneProps {
  /** Las 3 flores PNG del tema; se ciclan entre las 32 posiciones. */
  flowers: string[];
}

export const FlowerBurstScene: React.FC<FlowerBurstSceneProps> = ({ flowers }) => {
  const petals = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = i * 137.5 * (Math.PI / 180);
        const pseudoRandom = (Math.sin(i * 999) + 1) / 2;
        return {
          key: i,
          src: flowers[i % Math.max(1, flowers.length)],
          tx: `${(Math.cos(angle) * Math.sqrt(i) * 36).toFixed(1)}px`,
          ty: `${(Math.sin(angle) * Math.sqrt(i) * 78).toFixed(1)}px`,
          rot: `${(i * 40) % 360}deg`,
          scale: (1.2 + pseudoRandom * 0.5).toFixed(3),
          delay: `${(i % 6) * 30}ms`,
          z: 50 + i,
        };
      }),
    [flowers],
  );

  return (
    <div className="burst-scene" aria-hidden="true">
      <style>{CSS}</style>
      {petals.map((p) =>
        p.src ? (
          <div
            key={p.key}
            className="burst-flower"
            style={
              {
                zIndex: p.z,
                '--tx': p.tx,
                '--ty': p.ty,
                '--rot': p.rot,
                '--scale': p.scale,
                '--d': p.delay,
              } as React.CSSProperties
            }
          >
            <img src={p.src} alt="" draggable={false} />
          </div>
        ) : null,
      )}
    </div>
  );
};
