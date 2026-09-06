import React from 'react';
import { Ornament } from '../../../../components/decor';
import { useMediaQuery } from '../../../../utils/useMediaQuery';
import { AutoMarquee } from '../ui/AutoMarquee';

/** Caja de cada tarjeta. La comparten el bento y el carrusel. */
const CARD =
  'bg-white rounded-4xl p-6 md:p-8 border border-wine/10 flex flex-col justify-between overflow-hidden relative group ambient-shadow hover:ambient-shadow-lg transition-shadow';

interface Feature {
  key: string;
  /** Ocupa dos columnas del bento en escritorio. */
  wide: boolean;
  content: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    key: 'musica',
    wide: true,
    content: (
      <>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-blush rounded-full flex items-center justify-center text-wine mb-4 ring-1 ring-wine/10">
            <span className="material-symbols-outlined">music_note</span>
          </div>
          <h3 className="font-headline-sm text-on-background mb-2">Música de fondo (YouTube)</h3>
          <p className="font-body-md text-on-surface-variant max-w-sm">
            Vincula su canción favorita. Se reproducirá suavemente mientras lee tus palabras.
          </p>
        </div>
        {/* Gráfico de ecualizador */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-container rounded-full mix-blend-multiply opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute bottom-6 right-6 flex items-end gap-1 opacity-50">
          <div className="w-2 bg-primary rounded-t-sm h-4 animate-[bounce_1s_infinite]"></div>
          <div className="w-2 bg-primary rounded-t-sm h-8 animate-[bounce_1.2s_infinite_0.1s]"></div>
          <div className="w-2 bg-primary rounded-t-sm h-6 animate-[bounce_0.9s_infinite_0.2s]"></div>
          <div className="w-2 bg-primary rounded-t-sm h-10 animate-[bounce_1.1s_infinite_0.3s]"></div>
          <div className="w-2 bg-primary rounded-t-sm h-5 animate-[bounce_1s_infinite_0.4s]"></div>
        </div>
      </>
    ),
  },
  {
    key: 'galeria',
    wide: false,
    content: (
      <>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-blush rounded-full flex items-center justify-center text-wine mb-4 ring-1 ring-wine/10">
            <span className="material-symbols-outlined">photo_library</span>
          </div>
          <h3 className="font-headline-sm text-on-background mb-2">Galería de fotos</h3>
          <p className="font-body-md text-on-surface-variant">
            Un espacio para revivir esos momentos únicos.
          </p>
        </div>
        {/* Gráfico de foto Polaroid */}
        <div className="absolute -right-4 -bottom-4 w-32 h-32 rotate-12 bg-surface shadow-md rounded-lg p-2 border border-surface-variant group-hover:rotate-6 transition-transform">
          <div
            className="bg-cover bg-center w-full h-full rounded bg-surface-container-high"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDu5cnFXGPvxEB3bLY9y0wkUH-RiCD2xg8k8bui7EFZ8CsspCXpBmG8SxU2Piz8kxAg-hP4kO9zc06mTOCoJRDjD-Z0_QmWNHIyt1z3byVZ7u-phnzVI0O-qSPgTRF2-cwUnPYaHUj1NO6EtXf0JVkK_6SIWUM9PDMeFMxYssjhnniM2NREBrJJRwLQQmXsPu0aqfDKpq804pYDhtBRH1Z4g_sBk3SLs2bE1q5ahNzRLEgClVZmqbju')",
            }}
          ></div>
        </div>
      </>
    ),
  },
  {
    key: 'disenos',
    wide: false,
    content: (
      <>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-blush rounded-full flex items-center justify-center text-wine mb-4 ring-1 ring-wine/10">
            <span className="material-symbols-outlined">palette</span>
          </div>
          <h3 className="font-headline-sm text-on-background mb-2">Diseños personalizados</h3>
          <p className="font-body-md text-on-surface-variant">
            Estilos premium y románticos que parecen papel de alta costura.
          </p>
        </div>
        {/* Gráfico de círculos superpuestos */}
        <div className="absolute -right-8 -bottom-8 flex gap-2 rotate-[-10deg] opacity-70">
          <div className="w-16 h-16 rounded-full bg-[#fdfbf7] shadow-sm border border-outline-variant/20"></div>
          <div className="w-16 h-16 rounded-full bg-[#2a2a2a] shadow-sm border border-outline-variant/20"></div>
          <div className="w-16 h-16 rounded-full bg-[#fdf0f2] shadow-sm border border-outline-variant/20"></div>
        </div>
      </>
    ),
  },
  {
    key: 'entrega',
    wide: true,
    content: (
      <>
        <div className="relative z-10 max-w-sm">
          <div className="w-12 h-12 bg-blush rounded-full flex items-center justify-center text-wine mb-4 ring-1 ring-wine/10">
            <span className="material-symbols-outlined">send</span>
          </div>
          <h3 className="font-headline-sm text-on-background mb-2">Entrega instantánea</h3>
          <p className="font-body-md text-on-surface-variant">
            Genera un enlace único y envíalo por WhatsApp al instante. Sin esperas.
          </p>
        </div>
        {/* Gráfico de código QR gigante */}
        <div className="absolute right-4 bottom-4 md:right-8 md:top-1/2 md:-translate-y-1/2 md:bottom-auto opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
          <span
            className="material-symbols-outlined text-primary block leading-none"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: 'clamp(80px, 15vw, 140px)' }}
          >
            qr_code_2
          </span>
        </div>
      </>
    ),
  },
];

/**
 * "Todo lo que necesitas para emocionar". Vivía dentro de la sección 5; ahora
 * acompaña al resultado de la carta en la sección 3, que es donde el visitante
 * acaba de ver de qué está hecha.
 *
 * En móvil las cuatro tarjetas se apilaban y sumaban casi mil píxeles: van en
 * un carrusel que avanza solo. En escritorio el bento se queda tal cual, con
 * sus dos tarjetas anchas — ahí las cuatro caben a la vista y un carrusel
 * escondería contenido sin motivo.
 */
export const EmotionGrid: React.FC = () => {
  const isWide = useMediaQuery('(min-width: 768px)');

  return (
    <div className="w-full">
      {/* Título de la sección */}
      <div className="text-center mb-10 md:mb-16">
        <h2 className="font-headline-md text-on-background mb-3">
          Todo lo que necesitas para{' '}
          <span className="font-script font-normal text-wine text-[1.4em] leading-none">
            emocionar
          </span>
        </h2>
        <Ornament tone="rose" className="mx-auto mb-4" />
        <p className="font-body-lg text-on-surface-variant">
          Diseñado con cuidado para crear una experiencia multisensorial.
        </p>
      </div>

      {isWide ? (
        /* BENTO GRID DE 4 TARJETAS — sin cambios respecto a antes */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 md:auto-rows-[250px]">
          {FEATURES.map((f) => (
            <div key={f.key} className={`${f.wide ? 'md:col-span-2' : ''} ${CARD}`}>
              {f.content}
            </div>
          ))}
        </div>
      ) : (
        <AutoMarquee itemWidth={272} speed={24} label="Lo que incluye la dedicatoria">
          {FEATURES.map((f) => (
            /* min-h iguala las tarjetas dentro de la cinta */
            <div key={f.key} className={`${CARD} h-full min-h-[248px]`}>
              {f.content}
            </div>
          ))}
        </AutoMarquee>
      )}
    </div>
  );
};
