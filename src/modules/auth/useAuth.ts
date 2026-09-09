import { use } from 'react';
import { AuthContext, type AuthModel } from './AuthContext';

/**
 * Lee el estado de sesión. Falla en el acto fuera de un `AuthProvider`: un
 * valor por defecto silencioso escondería justo el error que se quiere ver.
 */
export const useAuth = (): AuthModel => {
  const model = use(AuthContext);
  if (!model) {
    throw new Error('useAuth necesita un <AuthProvider> por encima en el árbol.');
  }
  return model;
};
