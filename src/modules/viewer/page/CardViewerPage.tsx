import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PhonePreview } from '../../editor/components/PhonePreview';
import { loadCard } from '../../../utils/cardStore';
import { Ornament, Rose } from '../../../components/decor';

/**
 * Visor público de una dedicatoria. Lee la carta por id y la muestra a pantalla
 * completa. Mientras el almacén sea local, sólo resuelve en el navegador que la
 * creó; con la API conectada, aquí va el fetch por id.
 */
export default function CardViewerPage() {
  const { id } = useParams<{ id: string }>();
  const card = useMemo(() => (id ? loadCard(id) : null), [id]);

  if (!card) {
    return (
      <div className="relative min-h-screen paper-sheet paper-vignette flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <Rose size={120} className="pointer-events-none absolute -left-6 -bottom-10 opacity-25 -rotate-12 hidden md:block" />
        <Rose size={100} className="pointer-events-none absolute -right-4 -bottom-8 opacity-20 rotate-[24deg] hidden md:block" />

        <h1 className="font-headline-md text-2xl text-on-background">
          No encontramos esta{' '}
          <span className="font-script font-normal text-wine text-[1.4em] leading-none">carta</span>
        </h1>
        <Ornament tone="gold" className="mx-auto my-4" />
        <p className="text-sm text-wine/70 max-w-sm">
          El enlace puede haber expirado, o la carta se creó en otro dispositivo.
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

  return <PhonePreview data={card.data} isFullView />;
}
