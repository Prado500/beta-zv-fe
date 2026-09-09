import { createContext } from 'react';
import type { UserResponse } from './services/auth';

/**
 * Estado de sesión compartido por toda la app.
 *
 * `unknown` es "hay pista de sesión y aún no hemos preguntado"; dura lo que
 * tarda `/me`. `anonymous` y `authenticated` son veredictos. Quien pinta debe
 * tratar `unknown` como "todavía no", no como "no": mostrar "Iniciar sesión" y
 * cambiarlo a un avatar medio segundo después es un parpadeo que se nota.
 */
export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';

export interface AuthSnapshot {
  status: AuthStatus;
  user: UserResponse | null;
}

export interface AuthModel extends AuthSnapshot {
  /** Alguien acaba de entrar o registrarse, o `/me` respondió: se publica. */
  setUser: (user: UserResponse) => void;
  /** La sesión dejó de existir: se cerró, o cualquier llamada devolvió 401. */
  clear: () => void;
}

export const ANONYMOUS: AuthSnapshot = { status: 'anonymous', user: null };
export const UNKNOWN: AuthSnapshot = { status: 'unknown', user: null };

/** `null` fuera de un `AuthProvider`: `useAuth` lo convierte en un error claro. */
export const AuthContext = createContext<AuthModel | null>(null);
