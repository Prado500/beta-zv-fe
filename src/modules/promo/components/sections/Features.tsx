import React from 'react';
import { HeartConfetti, PhotoFrame } from '../../../../components/decor';
import { SpotsMeter } from '../ui/SpotsMeter';
import { SPOTS, formatSpots } from '../../../../config/campaign';
import { YouTubeFacade } from '../../../../components/media/YouTubeFacade';
import { LANDING_VIDEOS } from '../../../../config/videos';

export const Features: React.FC = () => {
  return (
    <section className="py-14 md:py-section-gap relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px rule-gold"></div>
      <HeartConfetti count={6} tone="rose" opacity={0.12} className="z-0" />

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
        
        {/* Video 5 FOMO integrado sutilmente (Tu código original) */}
        <div className="relative grid lg:grid-cols-2 gap-6 md:gap-8 items-center bg-white/70 p-5 md:p-8 sticker-frame">
          <PhotoFrame tilt={-1.5} tape="left">
            <div className="aspect-video">
              <YouTubeFacade videoId={LANDING_VIDEOS.features} title="Video 5 Características" />
            </div>
          </PhotoFrame>
          <div>
             <span className="inline-flex items-center gap-1.5 bg-wine text-white font-bold px-3 py-1.5 rounded-full text-xs mb-3 tracking-wide">
               <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
               TENDENCIA NACIONAL
             </span>
             <h3 className="text-xl md:text-2xl font-bold mb-2">
               Cupos limitados a {formatSpots(SPOTS.total)} unidades
             </h3>
             <p className="text-on-surface-variant text-sm">Para mantener la exclusividad y la velocidad de los videos, hemos limitado el acceso. Cuando se acaben, se acabaron.</p>

             <SpotsMeter className="mt-5" />
          </div>
        </div>

      </div>
    </section>
  );
};