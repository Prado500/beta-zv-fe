import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../../../utils/api';
import { describeError } from '../../../utils/apiErrors';
import { logout } from '../../promo/services/checkout';

/**
 * Cerrar sesión desde el panel.
 *
 * Existe por los dispositivos compartidos: quien deja la sesión abierta en un
 * ordenador ajeno deja sus cartas a la vista de la siguiente persona, y esa
 * persona necesita poder entrar con su propia cuenta. El servidor borra la
 * cookie; aquí solo se avisa al panel para que vacíe la lista y abra la puerta.
 *
 * Un 401 al cerrar significa que la sesión ya no existía. Para quien quería
 * salir el resultado es el mismo, así que se trata como éxito y no como fallo.
 */

export interface SignOut {
  busy: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

export const useSignOut = (onSignedOut: () => void): SignOut => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Un solo cierre en vuelo, aunque se pulse dos veces. */
  const inFlight = useRef(false);

  const signOut = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await logout();
      onSignedOut();
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 401) {
        onSignedOut();
        return;
      }
      setError(describeError(problem));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [onSignedOut]);

  return { busy, error, signOut };
};
