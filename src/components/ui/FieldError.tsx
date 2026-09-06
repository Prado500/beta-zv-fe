import React from 'react';

interface FieldErrorProps {
  id: string;
  message?: string;
}

/**
 * Mensaje de un campo inválido.
 *
 * Se enlaza con `aria-describedby` desde el `input`, así que un lector de
 * pantalla lo anuncia al enfocar el campo — no hace falta `role="alert"`, que en
 * validación en vivo interrumpiría a cada tecla.
 */
export const FieldError: React.FC<FieldErrorProps> = ({ id, message }) => {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-error font-medium mt-1.5 flex items-start gap-1">
      <span className="material-symbols-outlined text-[14px] leading-none mt-px">error</span>
      {message}
    </p>
  );
};
