import React from 'react';
import { Ornament, CornerFlourish, HeartConfetti } from '../../../../components/decor';
import { FlowerShowcase } from './FlowerShowcase';

export const Origin: React.FC = () => {
  return (
    <section className="py-14 md:py-section-gap bg-paper-deep/60 relative overflow-hidden paper-grain">
      {/* Hairline superior que abre la sección */}
      <div className="absolute top-0 inset-x-0 h-px rule-rose"></div>
      <HeartConfetti count={6} tone="rose" opacity={0.13} className="z-0" />

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter">
        <div className="grid lg:grid-cols-2 gap-9 md:gap-12 items-center">
          
          <div className="relative">
            <CornerFlourish corner="tl" tone="gold" size={56} placement="-top-3 -left-3" className="z-10 opacity-80" />
            <CornerFlourish corner="br" tone="gold" size={56} placement="-bottom-3 -right-3" className="z-10 opacity-80" />
            <div className="w-full aspect-video bg-surface-container-lowest rounded-3xl shadow-xl overflow-hidden ambient-shadow-lg ring-1 ring-outline-variant/30">
            <iframe 
              src="https://www.youtube.com/embed/TU_VIDEO_ID_2" 
              title="Video 2 Origen"
              className="w-full h-full border-0"
            ></iframe>
            </div>
          </div>

          <div className="flex flex-col gap-6 text-center lg:text-left">
            {/* Título más grande */}
            <h2 className="text-[1.65rem] md:text-4xl lg:text-5xl font-black text-on-background tracking-tight">
              De Hombres,{' '}
              <span className="font-script font-normal text-wine text-[1.35em] leading-none">para Hombres.</span>
            </h2>

            <Ornament tone="rose" motif="diamond" className="mx-auto lg:mx-0 -mt-2" />
            <p className="text-base md:text-lg text-on-surface-variant font-medium leading-relaxed">
              Cansados de regalar lo típico, nuestro equipo de ingenieros diseñó esta plataforma.
              Al abrirla, la pantalla estalla en flores — y cada estilo trae las suyas.
            </p>

            <p className="inline-flex items-center gap-2 text-sm font-semibold text-wine mx-auto lg:mx-0">
              <span className="material-symbols-outlined text-[20px]">touch_app</span>
              Experiencia 100% interactiva
            </p>
          </div>

        </div>

        {/* Prueba de producto: los ramos reales de cada estilo */}
        <div className="mt-12 md:mt-16">
          <FlowerShowcase />
        </div>
      </div>
    </section>
  );
};