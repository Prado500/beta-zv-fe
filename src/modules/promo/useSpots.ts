import { useContext } from 'react';
import { SpotsContext } from './SpotsContext';
import type { Spots } from './services/spots';

/** Cupos de la campaña. Devuelve siempre un número utilizable, nunca `null`. */
export const useSpots = (): Spots => {
  const spots = useContext(SpotsContext);
  if (!spots) {
    throw new Error('useSpots debe usarse dentro de un <SpotsProvider>.');
  }
  return spots;
};
