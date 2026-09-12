import React from 'react';

interface PhotoLightboxProps {
  photos: string[];
  index: number;
  /** Corriendo la animación de salida. */
  closing: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const CSS = `
@keyframes superpositionIn {
  0% { transform: scale(0.7) translateY(12px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes superpositionOut {
  0% { transform: scale(1) translateY(0); opacity: 1; }
  100% { transform: scale(0.75) translateY(8px); opacity: 0; }
}
.animate-superposition-in { animation: superpositionIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-superposition-out { animation: superpositionOut 120ms cubic-bezier(0.4, 0, 1, 1) forwards; }
`;

/**
 * Una foto ampliada sobre la carta, como una polaroid levantada de la mesa.
 * Solo pinta: qué foto se ve y cuándo se cierra lo decide `usePhotoLightbox`.
 */
export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  index,
  closing,
  onClose,
  onPrev,
  onNext,
}) => (
  <div
    className={`absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 transition-opacity duration-150 ${
      closing ? 'opacity-0' : 'opacity-100'
    }`}
    onClick={onClose}
  >
    <style>{CSS}</style>
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar la foto"
      className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-xs transition-all cursor-pointer"
    >
      <span className="material-symbols-outlined block text-base">close</span>
    </button>

    <div
      className={`relative bg-white p-3 pb-8 rounded-xs shadow-2xl max-w-[85%] max-h-[75vh] flex flex-col items-center ${
        closing ? 'animate-superposition-out' : 'animate-superposition-in'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={photos[index]}
        alt={`Ampliada ${index + 1}`}
        className="max-w-full max-h-[55vh] object-contain rounded-xs bg-black/5"
      />
      <p className="font-serif text-xs text-slate-500 mt-3 font-medium">
        {index + 1} de {photos.length}
      </p>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined block text-sm">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined block text-sm">chevron_right</span>
          </button>
        </>
      )}
    </div>
  </div>
);
