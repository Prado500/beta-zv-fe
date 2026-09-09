import { Link, useParams } from 'react-router-dom';
import { PhonePreview } from '../../editor/components/PhonePreview';
import { Ornament, Rose } from '../../../components/decor';
import { usePublicLetter } from '../hooks/usePublicLetter';

/**
 * Visor público de una carta. Solo pinta.
 *
 * La petición, la cancelación al salir y la traducción del cuerpo guardado a
 * lo que la carta necesita viven en `usePublicLetter`: esta pantalla no sabe
 * que existe una API ni cómo viaja la canción dentro del texto.
 */
export default function CardViewerPage() {
  const { slug } = useParams<{ slug: string }>();
  const state = usePublicLetter(slug);

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
