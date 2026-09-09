import React from 'react';
import { Ornament, HeartConfetti } from '../../../../components/decor';
import { ReactionPost, type Reaction } from './ReactionPost';
import { Carousel } from '../ui/Carousel';
import { YouTubeFacade } from '../../../../components/media/YouTubeFacade';
import { LANDING_VIDEOS, REACTION_VIDEOS } from '../../../../config/videos';

/** Los videos de cada reacción viven en `config/videos.ts`, junto al resto. */
const REACTIONS: Reaction[] = [
  {
    id: 'qa',
    name: 'Control de Calidad Femenino',
    handle: '@lasqueaprueban',
    quote: 'Literal, si me regalan esto, me muero de amor.',
    videoId: REACTION_VIDEOS.qa,
  },
  {
    id: 'andrea',
    name: 'Andrea V.',
    handle: '@andreav',
    quote: 'Es el detalle más lindo porque no es un objeto que se olvida.',
    videoId: REACTION_VIDEOS.andrea,
  },
  {
    id: 'sofia',
    name: 'Sofía G.',
    handle: '@sofiag',
    quote: 'El QR en el portarretrato me pareció una idea genial.',
    videoId: REACTION_VIDEOS.sofia,
  },
];

export const SocialProof: React.FC = () => {
  return (
    <section className="py-14 md:py-section-gap overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
        <div className="relative overflow-hidden rounded-4xl px-5 md:px-12 py-10 md:py-14 text-center text-inverse-on-surface bg-linear-to-br from-wine-deep via-wine to-wine-deep shadow-[0_30px_70px_-25px_rgba(94,10,27,0.6)]">
          <HeartConfetti count={7} tone="light" opacity={0.12} className="z-0" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(120deg, #ffffff 0 1px, transparent 1px 12px)',
            }}
          ></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Aprobado y validado{' '}
              <span className="font-script font-normal text-primary-fixed text-[1.4em] leading-none">
                por ellas
              </span>
            </h2>
            <Ornament tone="light" className="mx-auto mb-4 opacity-70" />

            {/* Video 4 Principal (Reacciones en Grupo) */}
            <div className="max-w-3xl mx-auto aspect-video rounded-3xl overflow-hidden shadow-2xl mb-9 md:mb-12 border border-[#D4AF37]/25 ring-1 ring-white/10">
              <YouTubeFacade videoId={LANDING_VIDEOS.validation} title="Video 4 Validación" />
            </div>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Hecho de hombres para hombres, pero con el control de calidad estricto de ellas.
            </p>

            {/* Bucle en móvil; en escritorio son solo tres, así que van en rejilla */}
            <Carousel
              loop
              mobileOnly
              gridClassName="md:grid-cols-3"
              label="Reacciones en video"
              itemClassName="w-[78%] sm:w-[60%]"
              hint="Desliza para ver más"
            >
              {REACTIONS.map((reaction) => (
                <ReactionPost key={reaction.id} reaction={reaction} />
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};
