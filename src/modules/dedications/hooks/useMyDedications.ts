import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../utils/api';
import { describeError } from '../../../utils/apiErrors';
import { useAuth } from '../../auth/useAuth';
import { listDedications, type Dedication } from '../services/dedications';

/**
 * ViewModel del panel "Mis dedicatorias".
 *
 * La página no habla con la API: pide el listado a este hook y pinta el estado
 * que le devuelve. Cuatro estados y nada más, para que la vista no tenga que
 * combinar tres booleanos y adivinar qué significa `loading && error`.
 *
 * **El 401 no es un error, es la sonda de sesión.** La cookie es `HttpOnly`, así
 * que el navegador no puede saber si hay sesión sin preguntar; y la pregunta más
 * barata y más honesta es el propio listado: si responde, hay sesión y ya
 * tenemos los datos; si dice 401, se abre la puerta de inicio de sesión. Un
 * `GET /me` previo costaría una ida y vuelta más en cada visita y, aun así, el
 * listado tendría que tratar el 401 de una sesión caducada a medio uso.
 *
 * Lo que sí se hace con ese 401 es contárselo al estado global: si el panel
 * sabe que la sesión murió, la cabecera de la landing no debe seguir enseñando
 * un avatar al volver.
 */

export type PanelStatus = 'loading' | 'ready' | 'unauthenticated' | 'error';

export interface MyDedications {
  status: PanelStatus;
  items: Dedication[];
  error: string | null;
  /** Vuelve a pedir el listado: tras iniciar sesión, al reintentar o al volver de un modal. */
  reload: () => void;
  /**
   * La sesión dejó de existir (se cerró, o caducó y otra llamada devolvió 401).
   * Vacía el panel y abre la puerta sin gastar una petición para comprobarlo.
   */
  expire: () => void;
}

export const useMyDedications = (): MyDedications => {
  const { clear } = useAuth();
  const [status, setStatus] = useState<PanelStatus>('loading');
  const [items, setItems] = useState<Dedication[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Cada incremento dispara una petición nueva; el efecto no depende de nada más. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // La señal cancela la petición si la página se desmonta antes de la
    // respuesta (o si React, en desarrollo, monta dos veces): la respuesta de un
    // componente que ya no existe no debe escribir en el estado del siguiente.
    const controller = new AbortController();

    listDedications(controller.signal)
      .then((rows) => {
        setItems(rows);
        setError(null);
        setStatus('ready');
      })
      .catch((problem: unknown) => {
        if (problem instanceof DOMException && problem.name === 'AbortError') return;
        if (problem instanceof ApiError && problem.status === 401) {
          clear();
          setItems([]);
          setStatus('unauthenticated');
          return;
        }
        setError(describeError(problem));
        setStatus('error');
      });

    return () => controller.abort();
  }, [attempt, clear]);

  const reload = useCallback(() => {
    setError(null);
    setStatus('loading');
    setAttempt((value) => value + 1);
  }, []);

  const expire = useCallback(() => {
    setItems([]);
    setError(null);
    setStatus('unauthenticated');
  }, []);

  return { status, items, error, reload, expire };
};
