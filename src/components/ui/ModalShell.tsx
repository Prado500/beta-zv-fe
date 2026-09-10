import React, { useEffect, type ReactNode } from 'react';
import { CornerFlourish } from '../decor';

/**
 * Cáscara común de los modales del panel: fondo, panel, franja y filigranas.
 *
 * Los modales de la compra y del editor llevan esta misma vestimenta escrita en
 * cada uno; se extrae para los nuevos, no para tocar los que ya funcionan. Lo
 * que unifica no es el aspecto, es el comportamiento: cuándo cierra Escape,
 * cuándo cierra el fondo y cuándo la X se apaga, que es lo que se olvida al
 * copiar el JSX de un modal a otro.
 *
 * Sin `onClose` no hay X, ni Escape, ni cierre por el fondo: es una puerta, no
 * una ventana. Con `busy` todo eso se bloquea mientras la petición viva, para
 * que cerrar a medias no deje al usuario sin saber si lo que pulsó ocurrió.
 *
 * El foco no se gestiona aquí: cada modal sabe cuál es su primer control.
 */

interface ModalShellProps {
  /** `id` del título del modal; el overlay lo anuncia como nombre del diálogo. */
  labelledBy: string;
  /** Cierre por X, Escape y clic en el fondo. Sin él, el diálogo no se puede descartar. */
  onClose?: () => void;
  /** Mientras es `true`, no se puede cerrar por ningún camino. */
  busy?: boolean;
  /** `xl` es para los de dos columnas, como la postal del QR junto a su enlace. */
  size?: 'md' | 'lg' | 'xl';
  /** Clases extra del panel (`text-center`, por ejemplo). */
  className?: string;
  children: ReactNode;
}

const WIDTH = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-3xl' } as const;

export const ModalShell: React.FC<ModalShellProps> = ({
  labelledBy,
  onClose,
  busy = false,
  size = 'md',
  className = '',
  children,
}) => {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const dismiss = () => {
    if (onClose && !busy) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center px-4 py-8 bg-wine-deep/50 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={dismiss}
    >
      <div
        className={`relative w-full ${WIDTH[size]} bg-white rounded-4xl shadow-2xl border border-wine/15 p-7 md:p-8 overflow-hidden my-auto ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <CornerFlourish corner="tl" tone="gold" size={56} className="opacity-60" />
        <CornerFlourish corner="br" tone="gold" size={56} className="opacity-60" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="absolute top-4 right-4 z-20 text-wine/60 hover:text-wine transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};
