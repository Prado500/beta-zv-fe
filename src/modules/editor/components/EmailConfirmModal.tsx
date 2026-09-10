import React, { useEffect, useRef, useState } from 'react';
import { CornerFlourish, Ornament } from '../../../components/decor';
import { fieldClass } from '../../../components/ui/formStyles';

/**
 * Última parada antes de mandar la carta: confirmar el correo.
 *
 * No se pide escribirlo dos veces —nadie relee lo que acaba de teclear; se copia
 * y se pega, y el error de tipeo se duplica intacto—. Se le enseña escrito, se
 * dice exactamente qué va a llegar ahí y se deja corregirlo en el sitio.
 *
 * Es bloqueante a propósito: el correo con el QR, el enlace y el archivo sale
 * una sola vez y a una dirección que ya no se puede cambiar.
 *
 * **Se monta solo mientras está abierto**, y no lleva `open`. El correo editable
 * arranca del que trae la carta, y copiar una prop al estado con un efecto deja
 * un fotograma en el que el modal dice "A esta dirección ()": justo la frase que
 * tiene que dar confianza, vacía. Montando en cada apertura, `useState` ya nace
 * con el valor bueno y no hay nada que sincronizar.
 */

interface EmailConfirmModalProps {
  /** Correo tal como está en el formulario al pulsar "Guardar y compartir". */
  email: string;
  submitting: boolean;
  error: string | null;
  onConfirm: (email: string) => void;
  onCancel: () => void;
}

export const EmailConfirmModal: React.FC<EmailConfirmModalProps> = ({
  email,
  submitting,
  error,
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(email);
  const confirmButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmButton.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitting, onCancel]);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-100 flex items-center justify-center px-4 py-8 bg-wine-deep/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-email-title"
    >
      <div className="modal-panel relative w-full max-w-md bg-white rounded-4xl shadow-2xl border border-wine/15 px-7 py-8 md:px-9 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary" />
        <CornerFlourish corner="tl" tone="gold" size={54} className="opacity-65" />
        <CornerFlourish corner="br" tone="gold" size={54} className="opacity-65" />

        <div className="relative flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-full bg-blush flex items-center justify-center ring-4 ring-blush/50 mb-3">
            <span
              className="material-symbols-outlined text-wine text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              forward_to_inbox
            </span>
          </span>

          <h2
            id="confirm-email-title"
            className="font-headline-md text-xl font-bold text-on-background"
          >
            Confirma tu{' '}
            <span className="font-script font-normal text-wine text-[1.5em] leading-none">
              correo
            </span>
          </h2>
          <Ornament tone="gold" width={150} className="mx-auto mt-1 mb-3" />

          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
            ¿Estás seguro que este es el correo correcto? A esta dirección (
            <strong className="text-wine break-all">{value}</strong>) llegará el código QR, el
            enlace y el archivo descargable. Revisa que no haya errores de tipeo.
          </p>

          <div className="w-full mt-5 text-left">
            <label
              className="block text-[11px] font-bold text-wine/75 uppercase tracking-wider mb-1.5"
              htmlFor="confirm-email"
            >
              Corrígelo aquí si hace falta
            </label>
            <input
              id="confirm-email"
              type="email"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={submitting}
              autoComplete="email"
              spellCheck={false}
              className={fieldClass('idle', 'text-center font-medium disabled:opacity-60')}
            />
          </div>

          {error && (
            <p className="text-sm text-error font-medium mt-4" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 w-full flex flex-col gap-2.5">
            <button
              ref={confirmButton}
              type="button"
              onClick={() => onConfirm(value.trim())}
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? 'Enviando tu carta…' : 'Sí, es correcto'}
              <span className="material-symbols-outlined text-[18px]">check</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="w-full py-3 rounded-full border border-wine/25 text-wine font-semibold text-sm hover:bg-blush/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              No, quiero revisarlo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
