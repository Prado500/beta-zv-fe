import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { Header } from '../src/modules/promo/components/layout/Header';
import { PurchaseModal } from '../src/modules/promo/components/checkout/PurchaseModal';
import { CONFIRM_DELAY_SECONDS } from '../src/modules/promo/components/checkout/steps/EmailConfirmStep';
import type { CheckoutIntent } from '../src/modules/promo/hooks/useCheckoutFlow';
import { forgetCsrf } from '../src/utils/api';
import { forgetTerms } from '../src/modules/legal/services/legal';
import { renderAt, setupUser } from './testUtils';

/**
 * El ciclo de sesión completo, de la tecla al cuerpo HTTP.
 *
 * El resto de la suite mockea `modules/auth/services/auth`, así que `utils/api.ts`
 * —el módulo que arma la petición, cachea el token CSRF y decide cuándo pedir uno
 * nuevo— no lo probaba **nadie**. Ese hueco es justo donde se buscó el 401 al
 * reingresar tras cerrar sesión: no había forma de ver qué salía de verdad hacia
 * la API, solo qué función se había llamado.
 *
 * Aquí no se mockea el servicio: se mockea `fetch` con un **espejo del contrato
 * de `be/app`** —tarro de cookies, CSRF de doble envío, contraseñas guardadas de
 * verdad— y se recorre la pantalla real como la recorre una persona: alta desde
 * la cabecera, cerrar sesión desde el chip, volver a entrar. Lo que se afirma es
 * el cuerpo que sale y la cookie que viaja, que es lo único que el servidor ve.
 */

const CSRF_COOKIE = 'zy_csrf';
const SESSION_COOKIE = 'zy_session';

interface Cuenta {
  password: string;
  user: Record<string, unknown>;
}

/** Estado del servidor de mentira. Se vacía entre casos. */
const users = new Map<string, Cuenta>();
/** Los documentos ya tomados: en el backend es un índice único entre cuentas. */
const documentos = new Set<string>();
const sessions = new Map<string, string>();
/** El "navegador": lo que el servidor dejó puesto y vuelve en cada llamada. */
const jar = new Map<string, string>();
/** Todo lo que salió hacia la API, para poder afirmar sobre ello. */
interface Llamada {
  method: string;
  path: string;
  csrf?: string;
  cookies: Record<string, string>;
  body: Record<string, unknown> | null;
}
const llamadas: Llamada[] = [];
let contador = 0;
/** Si es `true`, la cookie CSRF "caduca" y el guardia rechaza el token cacheado. */
let csrfCaducado = false;

const reply = (status: number, data: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    text: async () => JSON.stringify(data),
    json: async () => data,
  }) as unknown as Response;

/** Espejo de `be/app/api/routers/auth.py` y `be/app/services/auth.py`. */
const servidor = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const path = String(input).replace(/^https?:\/\/[^/]+/, '');
  const method = init?.method ?? 'GET';
  const headers = (init?.headers ?? {}) as Record<string, string>;
  const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;

  llamadas.push({
    method,
    path,
    csrf: headers['X-CSRF-Token'],
    cookies: Object.fromEntries(jar),
    body,
  });

  if (path === '/api/v1/public/legal/terms') {
    // Público y sin CSRF, como el endpoint real.
    return reply(200, {
      version: TERMS_VERSION,
      checksum: 'a'.repeat(64),
      content: '# Términos\n\nTexto de prueba sobre fotografías y la Carta HTML.',
    });
  }

  if (path === '/api/v1/auth/csrf') {
    const token = `csrf-${++contador}`;
    jar.set(CSRF_COOKIE, token);
    csrfCaducado = false;
    return reply(200, { csrfToken: token });
  }

  // `csrf_guard`: compara la cabecera contra la cookie. Un fallo aquí es 403,
  // nunca 401 — la diferencia importa, porque decide qué mensaje ve la persona.
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const enviado = headers['X-CSRF-Token'];
    const cookie = csrfCaducado ? undefined : jar.get(CSRF_COOKIE);
    if (!enviado || enviado !== cookie) {
      return reply(403, {
        code: 'CSRF_INVALID',
        message: 'Actualiza la protección de sesión e intenta de nuevo.',
      });
    }
  }

  if (path === '/api/v1/auth/register' && method === 'POST') {
    // El backend hace `casefold()` sobre el correo, en el alta y al entrar.
    const clave = String(body!.email).toLowerCase();
    // El correo se comprueba ANTES que el documento: el frontend usa EMAIL_IN_USE
    // para mandar a iniciar sesión, y el orden decide qué código llega.
    if (users.has(clave)) {
      return reply(409, { code: 'EMAIL_IN_USE', message: 'No se puede registrar ese correo.' });
    }
    if (body!.acceptedTermsVersion !== TERMS_VERSION) {
      return reply(422, {
        code: 'TERMS_VERSION_MISMATCH',
        message: 'Los términos cambiaron. Recarga la página y vuelve a intentarlo.',
      });
    }
    const documento = `${body!.documentType}:${body!.documentNumber}`;
    if (documentos.has(documento)) {
      return reply(409, {
        code: 'REGISTRATION_CONFLICT',
        message: 'No pudimos crear la cuenta con esos datos. Si ya tienes cuenta, inicia sesión.',
      });
    }
    documentos.add(documento);
    const user = {
      id: `usr_${users.size + 1}`,
      email: clave,
      name: body!.name,
      emailVerified: false,
      createdAt: '2026-01-01T00:00:00Z',
    };
    users.set(clave, { password: String(body!.password), user });
    // El alta NO abre sesión: responde 201 y sin cookie.
    return reply(201, user);
  }

  if (path === '/api/v1/auth/login' && method === 'POST') {
    const clave = String(body!.email).toLowerCase();
    const cuenta = users.get(clave);
    // Correo desconocido y contraseña distinta dan el MISMO 401: el servidor no
    // revela cuál de los dos falló.
    if (!cuenta || cuenta.password !== body!.password) {
      return reply(401, {
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos.',
      });
    }
    const token = `sess-${++contador}`;
    sessions.set(token, clave);
    jar.set(SESSION_COOKIE, token);
    return reply(200, cuenta.user);
  }

  if (path === '/api/v1/auth/logout' && method === 'POST') {
    const token = jar.get(SESSION_COOKIE);
    if (token) sessions.delete(token);
    jar.delete(SESSION_COOKIE);
    return reply(200, { message: 'Sesión cerrada.' });
  }

  if (path === '/api/v1/me') {
    const token = jar.get(SESSION_COOKIE);
    if (!token || !sessions.has(token)) {
      return reply(401, { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.' });
    }
    return reply(200, users.get(sessions.get(token)!)!.user);
  }

  if (path === '/api/v1/purchases' && method === 'POST') {
    const token = jar.get(SESSION_COOKIE);
    if (!token || !sessions.has(token)) {
      return reply(401, { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.' });
    }
    return reply(201, {
      id: 'pur_1',
      status: 'pending',
      amountCents: 1990000,
      currency: 'COP',
      externalReference: 'ref-1',
      checkoutUrl: 'https://sandbox.mercadopago.com.co/checkout',
      hasLetter: false,
      paidAt: null,
      expiresAt: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    });
  }

  return reply(404, { code: 'NOT_FOUND', message: 'No existe.' });
};

vi.mock('../src/utils/navigation', () => ({ redirectTo: vi.fn() }));

/** El mismo cableado que `LandingPage`: la cabecera abre el modal en modo entrar. */
const Pantalla = () => {
  const [modal, setModal] = useState<CheckoutIntent | null>(null);
  return (
    <>
      <Header onSignIn={() => setModal('signin')} />
      <PurchaseModal
        open={modal !== null}
        intent={modal ?? 'checkout'}
        onClose={() => setModal(null)}
      />
    </>
  );
};

const EMAIL = 'prueba@ejemplo.com';
const PASSWORD = 'noni';
const DOCUMENTO = '1098765432';
/** La sirve el backend; el alta manda de vuelta esta misma cadena. */
const TERMS_VERSION = '2026-09-10';

const llamadasA = (path: string) => llamadas.filter((c) => c.path === path);
const ultima = (path: string) => llamadasA(path).at(-1);

const chip = () => screen.queryByRole('button', { name: /Tu cuenta/ });
const botonEntrar = () => screen.getByRole('button', { name: /Iniciar sesión/ });

type Usuario = ReturnType<typeof setupUser>;

/** Alta completa desde la cabecera: entrar -> "Crea tu cuenta" -> los tres tramos. */
const darDeAlta = async (
  user: Usuario,
  password = PASSWORD,
  email = EMAIL,
  documento = DOCUMENTO,
) => {
  await user.click(botonEntrar());
  await screen.findByLabelText('Contraseña');
  await user.click(screen.getByRole('button', { name: 'Crea tu cuenta' }));
  await screen.findByLabelText('Tu nombre');

  await user.type(screen.getByLabelText('Tu nombre'), 'Prueba');
  await user.type(screen.getByLabelText('Número de documento'), documento);
  await user.type(screen.getByLabelText('Tu correo'), email);
  await user.click(screen.getByRole('button', { name: /^Siguiente/ }));
  await screen.findByLabelText('Corrígelo aquí si hace falta');
  // El freno de 3 s del paso de confirmación se consume, no se espera.
  act(() => {
    vi.advanceTimersByTime(CONFIRM_DELAY_SECONDS * 1000);
  });
  await user.click(screen.getByRole('button', { name: /Sí, continuar/ }));
  await screen.findByLabelText('Contraseña');
  await user.type(screen.getByLabelText('Contraseña'), password);
  await user.type(screen.getByLabelText('Confirmar contraseña'), password);
  // El consentimiento es expreso: sin marcarlo, el alta no sale.
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: /Continuar al pago/ }));
  await waitFor(() => expect(chip()).not.toBeNull());
};

const cerrarSesion = async (user: Usuario) => {
  await user.click(screen.getByRole('button', { name: /Tu cuenta/ }));
  await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));
  await waitFor(() => expect(chip()).toBeNull());
};

const entrar = async (user: Usuario, password = PASSWORD, email = EMAIL) => {
  await user.click(botonEntrar());
  await screen.findByLabelText('Contraseña');
  await user.type(screen.getByLabelText('Tu correo'), email);
  await user.type(screen.getByLabelText('Contraseña'), password);
  await user.click(screen.getByRole('button', { name: /Entrar/ }));
};

beforeEach(() => {
  users.clear();
  documentos.clear();
  sessions.clear();
  jar.clear();
  llamadas.length = 0;
  contador = 0;
  csrfCaducado = false;
  // `api.ts` cachea el token CSRF en una variable de módulo que sobrevive a todo
  // el archivo. En un navegador de verdad ese caché nace con la pestaña; aquí hay
  // que vaciarlo a mano o un caso arrancaría con el token del anterior y una
  // cookie que ya no existe.
  forgetCsrf();
  // El texto legal también se cachea en una variable de módulo que sobrevive al
  // archivo entero; sin vaciarla, un caso vería el de otro y no gastaría petición.
  forgetTerms();
  vi.stubGlobal('fetch', vi.fn(servidor));
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

describe('Ciclo de sesión contra el contrato del backend', () => {
  it('el alta manda exactamente lo tecleado y abre sesión con ese mismo valor', async () => {
    const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
    renderAt(<Pantalla />);

    await darDeAlta(user);

    // `Register` declara `extra="forbid"`: `confirmPassword` tumbaría el alta con
    // un 422, y `mode` —que es del formulario, no del backend— también.
    expect(ultima('/api/v1/auth/register')!.body).toEqual({
      name: 'Prueba',
      email: EMAIL,
      password: PASSWORD,
      // Entero, no la cadena del `<select>`: es el código oficial de la DIAN.
      documentType: 13,
      documentNumber: DOCUMENTO,
      acceptedTermsVersion: TERMS_VERSION,
    });
    // Lo que se registra y lo que abre la sesión tienen que ser el MISMO secreto.
    expect(ultima('/api/v1/auth/login')!.body).toEqual({ email: EMAIL, password: PASSWORD });
  });

  it('tras cerrar sesión se vuelve a entrar con las mismas credenciales', async () => {
    const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
    renderAt(<Pantalla />);

    await darDeAlta(user);
    await cerrarSesion(user);
    await entrar(user);

    // La regresión que motivó esta prueba: el segundo inicio de sesión devolvía
    // 401 con la contraseña correcta.
    await waitFor(() => expect(chip()).not.toBeNull());
    expect(screen.queryByRole('alert')).toBeNull();

    const inicios = llamadasA('/api/v1/auth/login');
    expect(inicios).toHaveLength(2);
    // Byte a byte el mismo cuerpo: si algún día el segundo diverge del primero,
    // esta línea lo dice antes de que lo diga un usuario.
    expect(inicios[1].body).toEqual(inicios[0].body);
    // Y la sesión anterior ya no viaja: el logout la borró del navegador.
    expect(inicios[1].cookies[SESSION_COOKIE]).toBeUndefined();
  });

  it('cerrar sesión borra la cookie y NO gasta un token CSRF nuevo', async () => {
    const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
    renderAt(<Pantalla />);

    await darDeAlta(user);
    await cerrarSesion(user);
    await entrar(user);
    await waitFor(() => expect(chip()).not.toBeNull());

    // El token CSRF no va atado a la sesión —lo firma el servidor con su propio
    // secreto— así que sigue valiendo tras salir. Pedir otro sería una llamada
    // de más en el camino crítico de quien vuelve.
    expect(llamadasA('/api/v1/auth/csrf')).toHaveLength(1);
    const csrfs = new Set(
      llamadas.filter((c) => c.method === 'POST').map((c) => c.csrf),
    );
    expect(csrfs.size).toBe(1);
  });

  it('contraseña equivocada: 401 con el mensaje de credenciales, no el de sesión caducada', async () => {
    const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
    renderAt(<Pantalla />);

    await darDeAlta(user);
    await cerrarSesion(user);
    await entrar(user, 'otra-cosa');

    // El 401 genérico dice "tu sesión expiró", que aquí sería mentira: no había
    // sesión, lo que falló fue la contraseña.
    const aviso = await screen.findByRole('alert');
    expect(aviso.textContent).toContain('Correo o contraseña incorrectos');
    expect(chip()).toBeNull();
  });

  it('el CSRF caducado se renueva solo y el inicio de sesión sale adelante', async () => {
    const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
    renderAt(<Pantalla />);

    await darDeAlta(user);
    await cerrarSesion(user);

    // La cookie CSRF vive una hora; el token cacheado en el módulo, toda la
    // pestaña. Quien deja la página abierta desde ayer se encuentra con un 403
    // que no es culpa suya, y no debe perder el intento por eso.
    csrfCaducado = true;
    await entrar(user);

    await waitFor(() => expect(chip()).not.toBeNull());
    // Un token nuevo pedido, y el inicio de sesión reintentado una sola vez.
    expect(llamadasA('/api/v1/auth/csrf')).toHaveLength(2);
    expect(llamadasA('/api/v1/auth/login')).toHaveLength(3);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('doble clic en "Entrar" no manda dos inicios de sesión', async () => {
    const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
    renderAt(<Pantalla />);

    await darDeAlta(user);
    await cerrarSesion(user);

    await user.click(botonEntrar());
    await screen.findByLabelText('Contraseña');
    await user.type(screen.getByLabelText('Tu correo'), EMAIL);
    await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
    const boton = screen.getByRole('button', { name: /Entrar/ });
    await user.click(boton);
    await user.click(boton);

    await waitFor(() => expect(chip()).not.toBeNull());
    // El cerrojo síncrono de `useCheckoutFlow`: `busy` llega un render tarde y
    // dos clics rápidos caben en ese hueco.
    expect(llamadasA('/api/v1/auth/login')).toHaveLength(2);
  });

  it('toda escritura viaja con cookies y con la cabecera CSRF', async () => {
    const user = setupUser({ advanceTimers: vi.advanceTimersByTime });
    renderAt(<Pantalla />);

    await darDeAlta(user);
    await cerrarSesion(user);
    await entrar(user);
    await waitFor(() => expect(chip()).not.toBeNull());

    // Sin `credentials: 'include'` la cookie de sesión no viaja y todo responde
    // 401; sin la cabecera, 403. Las dos se comprueban en el mismo sitio.
    for (const llamada of llamadas.filter((c) => c.method === 'POST')) {
      expect(llamada.csrf, `${llamada.method} ${llamada.path} sin CSRF`).toBeTruthy();
      expect(
        llamada.cookies[CSRF_COOKIE],
        `${llamada.method} ${llamada.path} sin cookie CSRF`,
      ).toBeTruthy();
    }
  });
});
