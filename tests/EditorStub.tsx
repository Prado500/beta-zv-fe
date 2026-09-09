import { useLocation } from 'react-router-dom';

/**
 * Doble del editor para las pruebas de navegación.
 *
 * Enseña el `purchaseId` que le llegó en el estado de la ruta, que es lo único
 * que el editor real necesita para arrancar. Vive en su propio archivo porque
 * la regla de Fast Refresh no admite un componente junto a exportaciones que
 * no lo son, y el andamio del panel exporta fixtures y helpers.
 */
export const EditorStub = () => {
  const location = useLocation();
  const state = location.state as { purchaseId?: string } | null;
  return <p>EDITOR:{state?.purchaseId ?? 'sin-compra'}</p>;
};
