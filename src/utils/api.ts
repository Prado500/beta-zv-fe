/**
 * Cliente HTTP de la API. Único punto donde se hablan cookies y CSRF.
 *
 * La sesión del backend es una cookie opaca `HttpOnly`: el navegador la guarda y
 * la envía solo si cada llamada lleva `credentials: 'include'`, y JavaScript no
 * puede leerla ni falsificarla. Por eso aquí no hay ningún token en memoria ni en
 * `localStorage`: la sesión vive en el navegador, no en el estado de React.
 *
 * La protección CSRF es de doble envío: el backend deja una cookie legible y
 * espera el mismo valor en la cabecera `X-CSRF-Token` en toda escritura. Este
 * módulo lo pide una vez, lo cachea y lo renueva solo si el servidor lo rechaza.
 *
 * **Origen.** Por defecto las rutas son relativas, así que el navegador ve la API
 * en su mismo origen y las cookies viajan sin fricción. En desarrollo eso lo
 * resuelve el proxy de Vite (`/api` -> `localhost:8000`, ver `vite.config.ts`).
 * Apuntar a otro dominio con `VITE_API_BASE_URL` exige que ese backend declare el
 * origen en `CORS_ORIGINS` y emita cookies `SameSite=None; Secure`.
 */

const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

/** Ruta absoluta hacia la API; sirve también para `<img src>` de fotos públicas. */
export const apiUrl = (path: string): string => `${BASE_URL}${path}`;

export interface FieldError {
  field: string;
  type: string;
}

/** Error con la forma que devuelve el backend: `code`, `message` y `fieldErrors`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];
  readonly requestId: string | null;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors: FieldError[] = [],
    requestId: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}

/** Error de red: el servidor no respondió (offline, DNS, CORS). */
export class NetworkError extends Error {
  constructor() {
    super('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
    this.name = 'NetworkError';
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Cuerpo JSON. Excluyente con `form`. */
  body?: unknown;
  /** Cuerpo multipart (subida de archivos). No se le pone Content-Type a mano. */
  form?: FormData;
  signal?: AbortSignal;
}

/** Métodos que el backend protege con CSRF. */
const WRITES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let csrfToken: string | null = null;
/** Petición de token en vuelo: varias llamadas simultáneas comparten una sola. */
let csrfRequest: Promise<string> | null = null;

const requestCsrf = async (): Promise<string> => {
  let response: Response;
  try {
    response = await fetch(apiUrl('/api/v1/auth/csrf'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new NetworkError();
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'CSRF_UNAVAILABLE', 'No pudimos iniciar la sesión segura.');
  }
  const data = (await response.json()) as { csrfToken: string };
  return data.csrfToken;
};

/** Devuelve el token cacheado o lo pide. Una sola petición aunque haya varias en cola. */
const ensureCsrf = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = requestCsrf().finally(() => {
      csrfRequest = null;
    });
  }
  csrfToken = await csrfRequest;
  return csrfToken;
};

/** Olvida el token para que la próxima escritura pida uno nuevo. */
export const forgetCsrf = (): void => {
  csrfToken = null;
};

const parse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toApiError = (status: number, payload: unknown): ApiError => {
  const body = (payload ?? {}) as {
    code?: string;
    message?: string;
    fieldErrors?: FieldError[];
    requestId?: string;
  };
  return new ApiError(
    status,
    body.code ?? 'HTTP_ERROR',
    body.message ?? 'No pudimos completar la solicitud.',
    body.fieldErrors ?? [],
    body.requestId ?? null,
  );
};

const send = async (path: string, options: ApiOptions, token: string | null): Promise<Response> => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['X-CSRF-Token'] = token;
  // El Content-Type de multipart lo pone el navegador con su `boundary`; si lo
  // fijáramos a mano, el backend no sabría dónde empieza cada parte.
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  try {
    return await fetch(apiUrl(path), {
      method: options.method ?? 'GET',
      // Sin esto la cookie de sesión no viaja y todo responde 401.
      credentials: 'include',
      headers,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new NetworkError();
  }
};

/**
 * Llama a la API con la sesión y el CSRF ya resueltos.
 *
 * Toda escritura obtiene el token antes de salir; si el servidor lo rechaza
 * (caducó a la hora, o el usuario tenía la pestaña abierta desde ayer), se pide
 * uno nuevo y se reintenta **una sola vez**: el usuario no debería perder lo que
 * escribió por un detalle de infraestructura.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const needsCsrf = WRITES.has(method);

  let response = await send(path, options, needsCsrf ? await ensureCsrf() : null);

  if (needsCsrf && response.status === 403) {
    const payload = await parse(response);
    const error = toApiError(403, payload);
    if (error.code !== 'CSRF_INVALID') throw error;
    forgetCsrf();
    response = await send(path, options, await ensureCsrf());
  }

  const payload = await parse(response);
  if (!response.ok) throw toApiError(response.status, payload);
  return payload as T;
}

export const apiGet = <T>(path: string, signal?: AbortSignal): Promise<T> =>
  apiFetch<T>(path, { method: 'GET', signal });

export const apiPost = <T>(path: string, body?: unknown): Promise<T> =>
  apiFetch<T>(path, { method: 'POST', body: body ?? {} });

export const apiUpload = <T>(path: string, form: FormData): Promise<T> =>
  apiFetch<T>(path, { method: 'POST', form });
