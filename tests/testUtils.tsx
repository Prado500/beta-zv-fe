import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ANONYMOUS, type AuthSnapshot } from '../src/modules/auth/AuthContext';
import { AuthProvider } from '../src/modules/auth/AuthProvider';
import type { UserResponse } from '../src/modules/auth/services/auth';

/**
 * Utilidades comunes de las pruebas.
 *
 * Nada de aquí conoce la implementación de los componentes: monta, escribe y
 * espera, que es lo que hace una persona.
 */

/**
 * `delay: null` quita la pausa entre teclas; con validación en vivo se nota.
 *
 * `options` existe para las pruebas que congelan el reloj: `userEvent` programa
 * sus propios temporizadores y, con `vi.useFakeTimers()`, hay que pasarle
 * `advanceTimers` o cada pulsación se queda esperando un tiempo que no avanza.
 */
export const setupUser = (options: Parameters<typeof userEvent.setup>[0] = {}) =>
  userEvent.setup({ delay: null, ...options });

/** Quien compra en las pruebas: lo que `/me` y `/auth/login` devuelven. */
export const USER: UserResponse = {
  id: 'usr_123',
  email: 'sebas@ejemplo.com',
  name: 'Sebastián Prado',
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00Z',
};

/** Estado de sesión "ya dentro", para montar pantallas como las ve un recurrente. */
export const signedIn = (user: UserResponse = USER): AuthSnapshot => ({
  status: 'authenticated',
  user,
});

/**
 * Monta un componente dentro de un router de memoria y de un estado de sesión.
 *
 * `state` existe porque el editor recibe el `purchaseId` en el estado de la
 * ruta, no en la URL: es la llave de una compra pagada y no debe poder
 * escribirse a mano en la barra de direcciones.
 *
 * `auth` es lo que la app ya sabe de la sesión al montar. Por defecto, nada:
 * anónimo y sin sonda, que es como llega casi todo el mundo.
 */
export const renderAt = (
  ui: ReactElement,
  { path = '/', state, auth = ANONYMOUS }: { path?: string; state?: unknown; auth?: AuthSnapshot } = {},
) => {
  // La vuelta de la pasarela llega con `?payment_id=...`: el `path` puede traer
  // su query y hay que separarla, porque `pathname` no la interpreta.
  const [pathname, search] = path.split('?');
  return render(
    <MemoryRouter initialEntries={[{ pathname, search: search ? `?${search}` : '', state }]}>
      <AuthProvider initial={auth}>{ui}</AuthProvider>
    </MemoryRouter>,
  );
};

/** Promesa que se resuelve cuando la prueba quiera: así se congela una petición. */
export const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** Botón nativo, para poder preguntar por `disabled` sin castings por todas partes. */
export const asButton = (element: HTMLElement): HTMLButtonElement => element as HTMLButtonElement;

/** Campo nativo, para leer `value` sin castings. */
export const asInput = (element: HTMLElement): HTMLInputElement => element as HTMLInputElement;
