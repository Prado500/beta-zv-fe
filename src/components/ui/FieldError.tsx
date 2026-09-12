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
    <p id={id} className="text-xs text-error/85 mt-1.5 flex items-start gap-1.5">
      {/*
        Un punto y no el icono de aspa: con varios campos a la vez, esa fila de
        círculos rojos con admiración convertía un formulario a medio llenar en
        una pantalla de errores. El punto señala sin levantar la voz, y el color
        ya dice que algo falta.
      */}
      <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-error/70" />
      {message}
    </p>
  );
};
