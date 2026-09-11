import { apiGet, apiPost } from '../../../utils/api';

/**
 * Cuenta y sesión: alta, entrada, salida y "¿quién soy?".
 *
 * Vivían en el servicio de compra porque la cuenta nacía al comprar. Ahora la
 * sesión la necesitan la landing, el panel y el modal por igual, así que se
 * mudan a su propio módulo. Aquí no se decide nada: se pide y se devuelve.
 */

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Credentials {
  email: string;
  password: string;
  name: string;
  /** Código oficial DIAN, como lo devuelve el `<select>`. */
  documentType: string;
  documentNumber: string;
  /** Versión exacta del texto que la persona aceptó, tal y como la sirvió la API. */
  acceptedTermsVersion: string;
}

/**
 * Rango que exige el backend en `Register.password` (`be/app/schemas/auth.py`).
 *
 * Son espejo, no una opinión de esta pantalla: si aquí se pide más de lo que
 * allí se acepta, el formulario deja pasar contraseñas que el servidor devuelve
 * con un 422 y la persona no entiende por qué. No hay ninguna otra regla —ni
 * mayúsculas, ni dígitos, ni símbolos— a propósito: se quieren contraseñas que
 * se recuerden. Solo aplican al alta: al entrar, el servidor acepta hasta 128.
 */
export const MIN_PASSWORD = 4;
export const MAX_PASSWORD = 10;

/**
 * Alta de la cuenta. **No abre sesión**: el backend responde 201 con el usuario
 * y sin cookie, así que después hay que llamar a `login`.
 *
 * Ya no crea solo una cuenta: es un acto legal. La misma petición guarda el
 * documento de identidad (cifrado, para poder facturar ante la DIAN) y la prueba
 * de que la persona autorizó el tratamiento de sus datos. Las tres cosas entran
 * juntas o no entra ninguna, así que un fallo aquí no deja una cuenta a medias.
 *
 * El cuerpo se arma campo a campo y no se reenvía el objeto del formulario tal
 * cual: `Register` declara `extra="forbid"`, así que cualquier campo de más
 * —`confirmPassword` o `acceptsTerms`, sin ir más lejos— tumbaría la petición
 * con un 422.
 */
export const register = ({
  name,
  email,
  password,
  documentType,
  documentNumber,
  acceptedTermsVersion,
}: Credentials): Promise<UserResponse> =>
  apiPost<UserResponse>('/api/v1/auth/register', {
    name,
    email,
    password,
    // El select devuelve texto; el backend espera el entero del catálogo DIAN.
    documentType: Number(documentType),
    documentNumber,
    acceptedTermsVersion,
  });

/** Abre la sesión: el servidor deja la cookie `HttpOnly` y devuelve el usuario. */
export const login = (email: string, password: string): Promise<UserResponse> =>
  apiPost<UserResponse>('/api/v1/auth/login', { email, password });

/**
 * La sonda de sesión. La cookie es `HttpOnly` y el navegador no la puede leer:
 * la única forma de saber si hay sesión es preguntar. Responde 401 si no la hay.
 */
export const currentUser = (signal?: AbortSignal): Promise<UserResponse> =>
  apiGet<UserResponse>('/api/v1/me', signal);

/**
 * Cierra la sesión en el servidor y borra su cookie.
 *
 * Es una escritura y lleva CSRF como cualquier POST. El token CSRF no se olvida
 * aquí a propósito: no va atado a la sesión —lo firma el servidor con su propio
 * secreto— y sigue valiendo para el siguiente inicio de sesión desde este mismo
 * navegador. Si la sesión ya había caducado, el backend responde igual: cerrar
 * lo que no existe no es un error para quien quería salir.
 */
export const logout = (): Promise<{ message: string }> =>
  apiPost<{ message: string }>('/api/v1/auth/logout');
