import { useCallback, useEffect, useRef, useState } from 'react';
import { ENVELOPE_OPEN_MS } from '../components/scenes/EnvelopeScene';
import { BLOOM_TOTAL_MS } from '../components/scenes/BloomScene';
import { PHRASE_TOTAL_MS } from '../components/scenes/PhraseScene';
import { FLOWER_BURST_MS } from '../components/scenes/FlowerBurstScene';

/**
 * La coreografía de la carta, sin pintar nada.
 *
 * Es la máquina de estados que va del sobre a la hoja:
 * sobre → apertura → floración → frase suspendida → recuerdos → estallido → carta.
 * Cada tramo dura lo que dice su escena; las dos pausas que dependen de la
 * persona —tocar el sobre y descubrir los recuerdos— entran por `open` y
 * `finishMemories`. Sin mensaje no hay frase que suspender; sin fotos no hay
 * recuerdos ni estallido, y de la frase se pasa directo a la carta.
 *
 * Las escenas corren SIEMPRE, también con "Reducir movimiento" activo: son el
 * producto, no un adorno. Muchos iPhone traen ese ajuste encendido y con la
 * política anterior la destinataria pasaba del sobre a la carta sin ver nada.
 * Esa preferencia solo apaga lo secundario dentro de cada escena.
 */

export type CardView = 'envelope' | 'opening' | 'blooming' | 'phrase' | 'memories' | 'burst' | 'card';

/** Cuánto dura cada momento, para quien tenga que esperar por ellos. */
export const SCENE_MS = {
  envelope: ENVELOPE_OPEN_MS,
  bloom: BLOOM_TOTAL_MS,
  phrase: PHRASE_TOTAL_MS,
  burst: FLOWER_BURST_MS,
} as const;

interface ChoreographyOptions {
  /** Hay una frase que suspender; sin ella, de la floración se pasa a lo siguiente. */
  hasPhrase: boolean;
  /** Hay fotos que descubrir; sin ellas se pasa directo a la carta. */
  hasPhotos: boolean;
}

export interface CardChoreography {
  view: CardView;
  /** El toque sobre el sobre. Solo actúa con el sobre cerrado. */
  open: () => void;
  /** Cierra la carta: corta lo que esté en curso y vuelve al sobre. */
  close: () => void;
  /** Los recuerdos ya se descubrieron: el estallido y después la carta. */
  finishMemories: () => void;
}

export const useCardChoreography = ({ hasPhrase, hasPhotos }: ChoreographyOptions): CardChoreography => {
  const [view, setView] = useState<CardView>('envelope');
  /** Espejo síncrono de `view`: `open` decide sin esperar al render. */
  const viewRef = useRef<CardView>('envelope');
  /** Se leen cuando el temporizador dispara, no cuando se programó. */
  const optionsRef = useRef({ hasPhrase, hasPhotos });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    optionsRef.current = { hasPhrase, hasPhotos };
  }, [hasPhrase, hasPhotos]);

  const go = useCallback((next: CardView) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const open = useCallback(() => {
    if (viewRef.current !== 'envelope') return;
    go('opening');
    later(ENVELOPE_OPEN_MS, () => {
      go('blooming');
      // Tras la frase: los recuerdos si hay fotos; si no, la carta
      const afterPhrase = () => go(optionsRef.current.hasPhotos ? 'memories' : 'card');
      later(BLOOM_TOTAL_MS, () => {
        if (!optionsRef.current.hasPhrase) {
          afterPhrase();
          return;
        }
        go('phrase');
        later(PHRASE_TOTAL_MS, afterPhrase);
      });
    });
  }, [go, later]);

  const finishMemories = useCallback(() => {
    if (viewRef.current !== 'memories') return;
    go('burst');
    later(FLOWER_BURST_MS, () => go('card'));
  }, [go, later]);

  const close = useCallback(() => {
    clearTimers();
    go('envelope');
  }, [clearTimers, go]);

  // Al desmontar no puede quedar un temporizador que cambie el estado de nadie.
  useEffect(() => clearTimers, [clearTimers]);

  return { view, open, close, finishMemories };
};
