/**
 * Pista local de "aquí hubo un inicio de sesión".
 *
 * La cookie de sesión es `HttpOnly`: el navegador la guarda y la envía, pero
 * JavaScript no puede ni leerla ni saber si existe. Saberlo cuesta una petición
 * a `/me`, y esa petición es una lectura de base de datos que la landing haría
 * en cada visita, también para la gran mayoría que nunca ha entrado.
 *
 * Esta marca evita ese gasto: se escribe al entrar o registrarse y se borra al
 * salir o cuando el servidor dice 401. Con ella, la app pregunta; sin ella, ni
 * pregunta. **No es una autorización**: en el peor caso —la marca sobrevive a
 * una sesión caducada— cuesta una llamada a `/me` que responde 401 y la limpia.
 *
 * Es `localStorage` y no `sessionStorage` a propósito: la cookie es del
 * navegador entero, así que una pestaña nueva tiene que heredar la pista o
 * mostraría "Iniciar sesión" a alguien que ya entró.
 */

const KEY = 'auth:signedInAt';

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    // Modo privado de Safari y navegadores con almacenamiento bloqueado.
    return null;
  }
};

export const rememberLogin = (): void => {
  try {
    storage()?.setItem(KEY, new Date().toISOString());
  } catch {
    /* Sin almacenamiento la app sigue: solo pierde el atajo de no preguntar. */
  }
};

export const forgetLogin = (): void => {
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* Nada que limpiar. */
  }
};

export const hasLoginHint = (): boolean => {
  try {
    return storage()?.getItem(KEY) !== null;
  } catch {
    return false;
  }
};
