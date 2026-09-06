import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PhonePreview } from '../../editor/components/PhonePreview';
import { themeFromSlug, type DedicationForm } from '../../editor/types';
import { apiGet, apiUrl, ApiError } from '../../../utils/api';
import { Ornament, Rose } from '../../../components/decor';

/**
 * Visor público de una carta. Lee del backend por `slug`, sin sesión.
 *
 * Antes leía de `localStorage`, así que el enlace solo abría en el navegador que
 * había creado la carta —justo lo que rompía el QR al escanearlo desde otro
 * teléfono—. Ahora la única fuente de verdad es la API, que es la misma que
 * consulta el correo enviado por el worker.
 */

interface PublicPhoto {
  position: number;
  caption: string | null;
  url: string;
}

interface PublicLetter {
  letterId: string;
  publishedVersion: number;
  title: string;
  recipientName: string;
  body: string;
  theme: string;
  photos: PublicPhoto[];
  publishedAt: string;
}

/** La carta publicada no distingue firma ni canción: viajan dentro del cuerpo. */
const toForm = (letter: PublicLetter): DedicationForm => ({
  title: letter.title,
  recipient: letter.recipientName,
  recipientEmail: '',
  sender: '',
  message: letter.body,
  songUrl: '',
  themeId: themeFromSlug(letter.theme),
  photos: letter.photos.map((photo) => ({
    tempId: null,
    // Ruta servida por la API pública; no hay `blob:` que valga fuera del editor.
    previewUrl: apiUrl(photo.url),
    fileName: photo.caption ?? '',
    status: 'ready' as const,
  })),
});

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: DedicationForm }
  | { kind: 'missing' };

export default function CardViewerPage() {
  const { slug } = useParams<{ slug: string }>();
  // Sin slug no hay nada que pedir: se decide en el estado inicial y no dentro del
  // efecto, para no encadenar un render extra antes de pintar el error.
  const [state, setState] = useState<State>(() =>
    slug ? { kind: 'loading' } : { kind: 'missing' },
  );

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    apiGet<PublicLetter>(`/api/v1/public/letters/${encodeURIComponent(slug)}`, controller.signal)
      .then((letter) => setState({ kind: 'ready', data: toForm(letter) }))
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof ApiError || error instanceof Error) setState({ kind: 'missing' });
      });
    return () => controller.abort();
  }, [slug]);

  if (state.kind === 'loading') {
    return (
      <div className="relative min-h-screen paper-sheet paper-vignette flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-wine text-[32px] animate-spin">
          progress_activity
        </span>
        <p className="text-sm text-wine/70 mt-3">Abriendo la carta…</p>
      </div>
    );
  }

  if (state.kind === 'missing') {
    return (
      <div className="relative min-h-screen paper-sheet paper-vignette flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <Rose
          size={120}
          className="pointer-events-none absolute -left-6 -bottom-10 opacity-25 -rotate-12 hidden md:block"
        />
        <Rose
          size={100}
          className="pointer-events-none absolute -right-4 -bottom-8 opacity-20 rotate-[24deg] hidden md:block"
        />

        <h1 className="font-headline-md text-2xl text-on-background">
          No encontramos esta{' '}
          <span className="font-script font-normal text-wine text-[1.4em] leading-none">carta</span>
        </h1>
        <Ornament tone="gold" className="mx-auto my-4" />
        <p className="text-sm text-wine/70 max-w-sm">
          El enlace puede estar incompleto, o la carta aún no se ha publicado. Si acabas de
          crearla, revisa el correo: te avisamos en cuanto esté lista.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-wine text-white font-semibold text-sm hover:bg-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <PhonePreview data={state.data} isFullView />;
}
