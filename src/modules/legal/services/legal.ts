import { apiGet } from '../../../utils/api';

/**
 * Texto legal vigente, servido por nuestra propia API.
 *
 * No hay landing externa a propósito: el texto se lee dentro del modal de compra, sin
 * sacar a nadie del embudo. Y vive en el backend, no aquí, porque el consentimiento
 * guarda el **checksum** del texto aceptado; si la copia que se muestra y la que se
 * hashea fueran dos, la prueba no probaría nada.
 */

export interface Terms {
  version: string;
  checksum: string;
  content: string;
}

/**
 * Una sola petición por sesión de navegador. El texto no cambia entre dos aperturas
 * del modal, y pedirlo cada vez sería gastar los IOPS del backend en algo inmutable.
 */
let cached: Promise<Terms> | null = null;

export const fetchTerms = (): Promise<Terms> => {
  cached ??= apiGet<Terms>('/api/v1/public/legal/terms').catch((problem: unknown) => {
    // Un fallo no puede envenenar la caché: el siguiente intento debe volver a pedirlo.
    cached = null;
    throw problem;
  });
  return cached;
};

/** Solo para las pruebas: vacía la caché entre casos. */
export const forgetTerms = (): void => {
  cached = null;
};
