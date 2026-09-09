import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../src/modules/auth/AuthProvider';
import { useAuth } from '../src/modules/auth/useAuth';
import { currentUser } from '../src/modules/auth/services/auth';
import { ApiError, NetworkError } from '../src/utils/api';
import { setupUser, USER } from './testUtils';

/**
 * La sonda de sesión.
 *
 * La cookie es `HttpOnly`, así que la app solo puede saber si hay sesión
 * preguntando a `/me`. Lo que se prueba aquí es **cuándo** pregunta —solo con
 * pista local de un inicio previo, y una sola vez— y qué hace con cada
 * respuesta. Nada mira dentro del proveedor: un componente de prueba lee
 * `useAuth` y lo pinta, que es lo que hace la cabecera.
 */

vi.mock('../src/modules/auth/services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/auth/services/auth')>()),
  currentUser: vi.fn(),
}));

const HINT = 'auth:signedInAt';

/** Lo que ve cualquier pantalla: estado, usuario y las dos formas de cambiarlo. */
const Probe = () => {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="user">{auth.user?.email ?? '-'}</p>
      <button type="button" onClick={() => auth.setUser(USER)}>
        entrar
      </button>
      <button type="button" onClick={() => auth.clear()}>
        salir
      </button>
    </div>
  );
};

const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

const status = () => screen.getByTestId('status').textContent;
const userEmail = () => screen.getByTestId('user').textContent;

beforeEach(() => {
  vi.mocked(currentUser).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('sin pista local no pregunta a /me: anónimo sin gastar una petición', () => {
    mount();
    expect(status()).toBe('anonymous');
    expect(currentUser).not.toHaveBeenCalled();
  });

  it('con pista pregunta una sola vez y publica al usuario', async () => {
    window.localStorage.setItem(HINT, '2026-01-01T00:00:00Z');
    vi.mocked(currentUser).mockResolvedValue(USER);

    mount();
    // Mientras responde, ni sí ni no: la cabecera no debe parpadear.
    expect(status()).toBe('unknown');

    await waitFor(() => expect(status()).toBe('authenticated'));
    expect(userEmail()).toBe(USER.email);
    expect(currentUser).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(HINT)).not.toBeNull();
  });

  it('con pista y 401: anónimo, y la pista se borra para no volver a preguntar en vano', async () => {
    window.localStorage.setItem(HINT, '2026-01-01T00:00:00Z');
    vi.mocked(currentUser).mockRejectedValue(
      new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.'),
    );

    mount();
    await waitFor(() => expect(status()).toBe('anonymous'));
    expect(userEmail()).toBe('-');
    expect(window.localStorage.getItem(HINT)).toBeNull();
  });

  it('con pista y sin red: anónimo por ahora, pero la pista se conserva', async () => {
    window.localStorage.setItem(HINT, '2026-01-01T00:00:00Z');
    vi.mocked(currentUser).mockRejectedValue(new NetworkError());

    mount();
    await waitFor(() => expect(status()).toBe('anonymous'));
    expect(window.localStorage.getItem(HINT)).not.toBeNull();
  });

  it('StrictMode monta dos veces y /me se pide una sola', async () => {
    window.localStorage.setItem(HINT, '2026-01-01T00:00:00Z');
    vi.mocked(currentUser).mockResolvedValue(USER);

    render(
      <StrictMode>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </StrictMode>,
    );

    await waitFor(() => expect(status()).toBe('authenticated'));
    expect(currentUser).toHaveBeenCalledTimes(1);
  });

  it('setUser y clear publican el cambio y escriben o borran la pista', async () => {
    const user = setupUser();
    mount();
    expect(window.localStorage.getItem(HINT)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'entrar' }));
    expect(status()).toBe('authenticated');
    expect(userEmail()).toBe(USER.email);
    expect(window.localStorage.getItem(HINT)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'salir' }));
    expect(status()).toBe('anonymous');
    expect(userEmail()).toBe('-');
    expect(window.localStorage.getItem(HINT)).toBeNull();
  });

  it('useAuth fuera del proveedor falla en el acto, no en silencio', () => {
    // React vuelca el error al consola además de lanzarlo; el volcado no es lo que se prueba.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
  });
});
