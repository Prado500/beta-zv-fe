import { useCallback, useEffect, useState } from 'react';
import { describeError } from '../../../utils/apiErrors';
import { fetchTerms, type Terms } from '../services/legal';

/**
 * ViewModel de los Términos.
 *
 * Se piden cuando la persona llega al paso de la contraseña, no al abrir el modal: en
 * ese momento ya invirtió dos pantallas y el texto está en memoria **antes** de que
 * pulse "Léelos aquí", así que ese modal abre instantáneo, sin spinner. Quien nunca
 * llega a ese paso no gasta la petición.
 *
 * Si la petición falla no se puede registrar a nadie: sin saber qué versión está
 * vigente, guardaríamos un consentimiento que no sabemos a qué texto corresponde. Por
 * eso el error se expone y el formulario lo usa para bloquear el envío.
 *
 * `attempt` es el mismo recurso que usa `useMyDedications`: reintentar es pedir otra
 * vuelta del efecto, no llamar a la carga a mano. Así el efecto no necesita escribir
 * estado de forma síncrona en su cuerpo, que es lo que la regla
 * `react-hooks/set-state-in-effect` prohíbe y lo que encadena renders en balde.
 */
export const useLegalTerms = (enabled: boolean) => {
  const [terms, setTerms] = useState<Terms | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Cada incremento dispara otra petición; el efecto no depende de nada más. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    // La respuesta de un modal que ya se cerró no debe escribir en el estado del
    // siguiente, ni en el doble montaje de StrictMode.
    let cancelled = false;

    fetchTerms()
      .then((loaded) => {
        if (!cancelled) setTerms(loaded);
      })
      .catch((problem: unknown) => {
        if (!cancelled) setError(describeError(problem));
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return { terms, error, loading: enabled && !terms && !error, retry };
};
