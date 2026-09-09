import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../../utils/api';
import { ANONYMOUS, AuthContext, UNKNOWN, type AuthModel, type AuthSnapshot } from './AuthContext';
import { forgetLogin, hasLoginHint, rememberLogin } from './authHint';
import { currentUser, type UserResponse } from './services/auth';

/**
 * Fuente única de verdad sobre la sesión en el cliente.
 *
 * Hasta ahora cada hook que descubría si había sesión —el listado del panel, la
 * puerta, el cierre— se lo guardaba para sí, y la landing no tenía forma de
 * saberlo. Aquí se centraliza: quien aprende algo lo publica con `setUser` o
 * `clear`, y quien pinta lo lee con `useAuth`.
 *
 * **La sonda es condicional.** Solo se pregunta a `/me` si hay pista local de
 * un inicio de sesión previo; sin ella, un visitante anónimo no gasta ni una
 * petición. Se dispara una sola vez por montaje: el `ref` cubre el doble montaje
 * de StrictMode en desarrollo, que sin él costaría dos lecturas por visita.
 *
 * Un 401 en la sonda borra la pista: la sesión caducó y no hay por qué volver a
 * preguntar hasta el próximo inicio. Un fallo de red la conserva: no sabemos
 * nada nuevo, y la próxima carga volverá a intentarlo.
 *
 * `initial` existe para las pruebas y para cualquier pantalla que ya sepa la
 * respuesta: con él no hay sonda.
 */

interface AuthProviderProps {
  initial?: AuthSnapshot;
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ initial, children }) => {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(
    () => initial ?? (hasLoginHint() ? UNKNOWN : ANONYMOUS),
  );
  const probed = useRef(false);

  useEffect(() => {
    if (snapshot.status !== 'unknown' || probed.current) return;
    probed.current = true;

    currentUser()
      .then((user) => {
        rememberLogin();
        setSnapshot({ status: 'authenticated', user });
      })
      .catch((problem: unknown) => {
        if (problem instanceof ApiError && problem.status === 401) forgetLogin();
        setSnapshot(ANONYMOUS);
      });
  }, [snapshot.status]);

  const setUser = useCallback((user: UserResponse) => {
    rememberLogin();
    setSnapshot({ status: 'authenticated', user });
  }, []);

  const clear = useCallback(() => {
    forgetLogin();
    setSnapshot(ANONYMOUS);
  }, []);

  const value = useMemo<AuthModel>(
    () => ({ ...snapshot, setUser, clear }),
    [snapshot, setUser, clear],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};
