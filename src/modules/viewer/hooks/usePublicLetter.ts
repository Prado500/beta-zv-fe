import { useEffect, useState } from 'react';
import { ApiError } from '../../../utils/api';
import type { DedicationForm } from '../../editor/types';
import { fetchPublicLetter, toDedicationForm } from '../services/publicLetters';

export type PublicLetterState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: DedicationForm }
  | { kind: 'missing' };

/**
 * Carga la carta pública por `slug`, sin sesión.
 *
 * Antes se leía de `localStorage`, así que el enlace solo abría en el navegador
 * que había creado la carta —justo lo que rompía el QR al escanearlo desde
 * otro teléfono—. La única fuente de verdad es la API, la misma que consulta
 * el correo enviado por el worker.
 */
export const usePublicLetter = (slug: string | undefined): PublicLetterState => {
  // Sin slug no hay nada que pedir: se decide en el estado inicial y no dentro
  // del efecto, para no encadenar un render extra antes de pintar el error.
  const [state, setState] = useState<PublicLetterState>(() =>
    slug ? { kind: 'loading' } : { kind: 'missing' },
  );

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetchPublicLetter(slug, controller.signal)
      .then((letter) => setState({ kind: 'ready', data: toDedicationForm(letter) }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof ApiError || error instanceof Error) setState({ kind: 'missing' });
      });
    return () => controller.abort();
  }, [slug]);

  return state;
};
