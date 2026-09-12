import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FieldError } from '../../../components/ui/FieldError';
import { fieldClass, fieldTone, LABEL } from '../../../components/ui/formStyles';

/**
 * Correo y contraseña para entrar: los mismos dos campos en la puerta del panel
 * y en el modo "ya tengo cuenta" del modal de compra.
 *
 * Pinta y nada más. Recibe lo que `register` devuelve y el veredicto de cada
 * campo; no sabe de qué formulario vienen ni qué pasa al enviar. Por eso puede
 * servir a dos hooks distintos sin que ninguno tenga que parecerse al otro.
 *
 * `current-password`, no `new-password`: es la señal para que el gestor de
 * contraseñas del navegador ofrezca la guardada, que para quien vuelve es el
 * mayor ahorro real de esta pantalla.
 */

interface CredentialFieldsProps {
  /** Prefijo de los `id`, para que dos formularios en la misma página no choquen. */
  idPrefix: string;
  email: UseFormRegisterReturn<'email'>;
  password: UseFormRegisterReturn<'password'>;
  emailError?: string;
  passwordError?: string;
  emailTouched: boolean;
  passwordTouched: boolean;
}

export const CredentialFields: React.FC<CredentialFieldsProps> = ({
  idPrefix,
  email,
  password,
  emailError,
  passwordError,
  emailTouched,
  passwordTouched,
}) => {
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;

  return (
    <>
      <div>
        <label className={LABEL} htmlFor={emailId}>
          Tu correo
        </label>
        <input
          id={emailId}
          type="email"
          {...email}
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? `${emailId}-error` : undefined}
          className={fieldClass(fieldTone(Boolean(emailError), emailTouched))}
        />
        <FieldError id={`${emailId}-error`} message={emailError} />
      </div>

      <div>
        <label className={LABEL} htmlFor={passwordId}>
          Contraseña
        </label>
        <input
          id={passwordId}
          type="password"
          {...password}
          autoComplete="current-password"
          maxLength={128}
          placeholder="Tu contraseña"
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? `${passwordId}-error` : undefined}
          className={fieldClass(fieldTone(Boolean(passwordError), passwordTouched))}
        />
        <FieldError id={`${passwordId}-error`} message={passwordError} />
      </div>
    </>
  );
};
