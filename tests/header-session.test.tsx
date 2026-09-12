import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Header } from '../src/modules/promo/components/layout/Header';
import { ANONYMOUS, UNKNOWN, type AuthSnapshot } from '../src/modules/auth/AuthContext';
import { logout } from '../src/modules/auth/services/auth';
import { asButton, deferred, renderAt, setupUser, signedIn, USER } from './testUtils';

/**
 * La cabecera sabe quién está dentro.
 *
 * Tres caras: "Iniciar sesión" para quien no ha entrado, el chip con las
 * iniciales y su menú para quien sí, y nada mientras la app todavía pregunta.
 * Se prueba lo que se ve y se pulsa; nadie mira dentro de `useAuth`.
 */

vi.mock('../src/modules/auth/services/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/modules/auth/services/auth')>()),
  logout: vi.fn(),
}));

const renderHeader = (auth: AuthSnapshot, onSignIn = vi.fn()) => {
  renderAt(<Header onSignIn={onSignIn} />, { auth });
  return onSignIn;
};

const signInButtons = () => screen.queryAllByRole('button', { name: /Iniciar sesión/ });
const accountButton = () => screen.queryByRole('button', { name: /Tu cuenta/ });
const menu = () => screen.queryByRole('menu');
const mobileToggle = () => screen.getByRole('button', { name: /Abrir menú|Cerrar menú/ });

beforeEach(() => {
  vi.mocked(logout).mockReset();
});

describe('Header · estado de sesión', () => {
  it('sin sesión ofrece "Iniciar sesión" y el botón abre la puerta', async () => {
    const user = setupUser();
    const onSignIn = renderHeader(ANONYMOUS);

    expect(signInButtons()).toHaveLength(1);
    expect(accountButton()).toBeNull();

    await user.click(signInButtons()[0]);
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('mientras la app aún pregunta a /me no enseña ni una cosa ni la otra', () => {
    renderHeader(UNKNOWN);
    expect(signInButtons()).toHaveLength(0);
    expect(accountButton()).toBeNull();
  });

  it('con sesión enseña las iniciales y el nombre de pila, y ya no ofrece entrar', () => {
    renderHeader(signedIn());

    const chip = accountButton();
    expect(chip).toBeTruthy();
    expect(chip?.textContent).toContain('SP');
    expect(chip?.textContent).toContain('Sebastián');
    expect(chip?.getAttribute('aria-expanded')).toBe('false');
    expect(signInButtons()).toHaveLength(0);
  });

  it('el chip abre un menú con el panel y la salida, y Escape lo cierra', async () => {
    const user = setupUser();
    renderHeader(signedIn());

    await user.click(accountButton()!);
    expect(menu()).toBeTruthy();
    expect(accountButton()?.getAttribute('aria-expanded')).toBe('true');

    const panel = screen.getByRole('menuitem', { name: /Mis dedicatorias/ });
    expect(panel.getAttribute('href')).toBe('/mis-dedicatorias');
    expect(screen.getByRole('menuitem', { name: /Cerrar sesión/ })).toBeTruthy();
    expect(menu()?.textContent).toContain(USER.email);

    await user.keyboard('{Escape}');
    expect(menu()).toBeNull();
    expect(accountButton()?.getAttribute('aria-expanded')).toBe('false');
  });

  it('cerrar sesión llama al servidor, borra la pista y vuelve a ofrecer entrar', async () => {
    const user = setupUser();
    vi.mocked(logout).mockResolvedValue({ message: 'Sesión cerrada.' });
    window.localStorage.setItem('auth:signedInAt', '2026-01-01T00:00:00Z');
    renderHeader(signedIn());

    await user.click(accountButton()!);
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));

    await waitFor(() => expect(signInButtons()).toHaveLength(1));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(accountButton()).toBeNull();
    expect(window.localStorage.getItem('auth:signedInAt')).toBeNull();
  });

  it('doble clic en cerrar sesión: una sola petición', async () => {
    const user = setupUser();
    const pending = deferred<{ message: string }>();
    vi.mocked(logout).mockReturnValue(pending.promise);
    renderHeader(signedIn());

    await user.click(accountButton()!);
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));

    // El menú se cerró; al abrirlo otra vez el botón está ocupado y apagado.
    await user.click(accountButton()!);
    const again = asButton(screen.getByRole('menuitem', { name: /Saliendo/ }));
    expect(again.disabled).toBe(true);
    await user.click(again);

    pending.resolve({ message: 'Sesión cerrada.' });
    await waitFor(() => expect(signInButtons()).toHaveLength(1));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('en el menú móvil: con sesión, quién eres y "Cerrar sesión"; sin ella, "Iniciar sesión"', async () => {
    const user = setupUser();
    const { unmount } = renderAt(<Header onSignIn={() => {}} />, { auth: signedIn() });

    await user.click(mobileToggle());
    const mobileNav = screen.getAllByRole('navigation')[1];
    expect(mobileNav.textContent).toContain(USER.name);
    expect(mobileNav.textContent).toContain(USER.email);
    expect(mobileNav.textContent).toContain('Cerrar sesión');
    expect(mobileNav.textContent).not.toContain('Iniciar sesión');
    unmount();

    const onSignIn = renderHeader(ANONYMOUS);
    await user.click(mobileToggle());
    // Escritorio y móvil: dos botones, el segundo dentro del menú desplegado.
    expect(signInButtons()).toHaveLength(2);
    await user.click(signInButtons()[1]);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    // Al pulsarlo el menú se recoge.
    expect(signInButtons()).toHaveLength(1);
  });
});
