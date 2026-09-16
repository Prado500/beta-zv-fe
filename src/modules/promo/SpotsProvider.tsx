import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { FALLBACK, SpotsContext } from './SpotsContext';
import { fetchSpots, type Spots } from './services/spots';

/**
 * Fuente única de la cifra de cupos dentro de la landing.
 *
 * Existe por la misma razón que `AuthProvider`: la barra superior, el medidor y la prosa
 * de la sección de tendencia pintan el mismo dato y viven en ramas distintas del árbol.
 * Sin esto serían tres peticiones por visita para enseñar tres veces el mismo número.
 *
 * El estado **arranca en el respaldo** y solo mejora si la API contesta. Un fallo se
 * traga a posta: no hay a quién avisar de que el contador de una landing va un poco
 * viejo, y cualquier mensaje de error ahí haría más daño que la cifra desactualizada.
 *
 * `loaded` cubre el doble montaje de StrictMode, igual que la sonda de `AuthProvider`:
 * sin él se gastarían dos lecturas por visita en desarrollo. Y, como en `AuthProvider`,
 * no hay bandera de cancelación: con `loaded` puesto, el segundo efecto de StrictMode
 * sale sin pedir nada, así que la única respuesta en vuelo es la del primero — y una
 * limpieza que la marcara como cancelada la tiraría a la basura, dejando el contador
 * clavado en el respaldo para siempre. Escribir el estado de un componente ya
 * desmontado no hace nada en React 19, que es justo lo que se quiere aquí.
 */

interface SpotsProviderProps {
  /** Para las pruebas y para quien ya sepa la respuesta: con él no se pide nada. */
  initial?: Spots;
  children: ReactNode;
}

export const SpotsProvider: React.FC<SpotsProviderProps> = ({ initial, children }) => {
  const [spots, setSpots] = useState<Spots>(initial ?? FALLBACK);
  const loaded = useRef(initial !== undefined);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    fetchSpots()
      .then(setSpots)
      .catch(() => {
        // Silencio deliberado: se queda el respaldo (ver el encabezado).
      });
  }, []);

  return <SpotsContext.Provider value={spots}>{children}</SpotsContext.Provider>;
};
