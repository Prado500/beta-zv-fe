import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

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

/**
 * Monta un componente dentro de un router de memoria.
 *
 * `state` existe porque el editor recibe el `purchaseId` en el estado de la
 * ruta, no en la URL: es la llave de una compra pagada y no debe poder
 * escribirse a mano en la barra de direcciones.
 */
export const renderAt = (
  ui: ReactElement,
  { path = '/', state }: { path?: string; state?: unknown } = {},
) => {
  // La vuelta de la pasarela llega con `?payment_id=...`: el `path` puede traer
  // su query y hay que separarla, porque `pathname` no la interpreta.
  const [pathname, search] = path.split('?');
  return render(
    <MemoryRouter initialEntries={[{ pathname, search: search ? `?${search}` : '', state }]}>
      {ui}
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
