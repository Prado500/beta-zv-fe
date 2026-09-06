import React, { useState } from 'react';
import { Ornament, HeartConfetti, Rose, Bow } from '../../../../components/decor';
import { QrShowcase } from './QrShowcase';

export const Hero: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative overflow-hidden py-12 md:py-section-gap">
      {/* Halos del hero como gradiente pintado: dos divs de 800px con
          blur(120px) y mix-blend-multiply obligaban a rasterizar todo el
          contexto de apilamiento en cada frame. */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(46% 52% at 88% 4%, rgba(255,218,219,0.62), transparent 68%), radial-gradient(42% 46% at 4% 96%, rgba(247,220,222,0.7), transparent 70%)',
        }}
      ></div>

      {/* Trama de papel muy tenue sobre los halos */}
      <div className="absolute inset-0 paper-weave pointer-events-none opacity-70"></div>

      {/* Corazones densos alrededor del hero */}
      <HeartConfetti count={9} tone="rose" opacity={0.2} className="z-0" />

      {/* Rosa dibujada asomando por el borde derecho */}
      <Rose
        size={168}
        className="pointer-events-none absolute -right-10 top-8 hidden lg:block opacity-90 rotate-18"
      />
      {/* Lazo en la esquina superior izquierda */}
      <Bow
        size={104}
        className="pointer-events-none absolute left-1 top-1 hidden xl:block opacity-70 -rotate-12"
      />
      
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        
        {/* Títulos más grandes e imponentes */}
        <div className="flex flex-col gap-5 md:gap-6 md:pr-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-surface-container-high text-primary font-label-sm px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 border border-primary/10">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            Especial 15 de Septiembre
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-on-background leading-[1.1] tracking-tight">
            ¿No sabes qué regalarle este
            <span className="block font-script font-normal text-wine text-[2.6rem] sm:text-[4rem] lg:text-[5.6rem] leading-[0.95] tracking-normal mt-1.5 md:mt-2 pb-2">
              15 de Septiembre?
            </span>
          </h1>

          <Ornament tone="gold" className="mx-auto md:mx-0 -mt-1" />
          
          <p className="text-base md:text-xl text-on-surface-variant max-w-xl mx-auto md:mx-0 font-medium">
            Crea una experiencia digital inmersiva. Un <span className="hand-underline font-semibold text-on-background">regalo único</span> que no encontrará en ningún centro comercial, diseñado para emocionar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-4">
            <a href="#pricing" className="bg-wine hover:bg-primary text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-[0_8px_30px_rgb(185,5,56,0.3)] hover:shadow-[0_8px_30px_rgb(185,5,56,0.5)] flex items-center justify-center gap-2 hover:-translate-y-1">
              Ver la Oferta
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Celular Elegante (Borde metálico/cristal) */}
        <div className="relative mx-auto w-full max-w-[228px] sm:max-w-[280px] md:max-w-[320px]">
          {/* Nota de papel pegada junto al celular */}
          <div className="absolute -left-12 -top-4 z-30 hidden lg:block rotate-[-8deg]">
            <div className="bg-white rounded-xl px-4 py-3 shadow-[0_14px_30px_-12px_rgba(94,10,27,0.4)] ring-1 ring-wine/10">
              <p className="font-script text-wine text-3xl leading-none">para ti</p>
            </div>
            <div
              className="absolute -top-2.5 left-6 h-6 w-16 -rotate-6 bg-blush/80 border border-white/60 shadow-sm"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(140,17,40,0.12) 0 3px, transparent 3px 9px)' }}
            ></div>
          </div>

          {/* Aro de filigrana detrás del celular */}
          <div className="absolute inset-0 -m-14 pointer-events-none hidden sm:block" aria-hidden="true">
            <div className="w-full h-full rounded-full border border-dashed border-primary/15 animate-drift-slow"></div>
            <div className="absolute inset-8 rounded-full border border-[#D4AF37]/20"></div>
          </div>

          <div className="absolute -right-6 top-1/4 bg-surface-container-lowest p-3 rounded-2xl shadow-xl animate-bounce z-20" style={{ animationDuration: '3s' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <div className="absolute -left-4 bottom-1/4 bg-surface-container-lowest p-3 rounded-2xl shadow-xl animate-bounce z-20" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
          </div>

          {/* Nuevo Diseño del Celular */}
          <div className="relative bg-linear-to-b from-gray-700 via-gray-900 to-black p-1.5 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/20">
            {/* Notch elegante */}
            <div className="absolute top-1.5 inset-x-0 h-6 flex justify-center z-20 pointer-events-none">
              <div className="w-24 h-6 bg-black rounded-b-2xl"></div>
            </div>
            
            <div className="w-full h-full bg-surface-container-lowest rounded-[2.2rem] overflow-hidden relative group aspect-9/19">
              {!isPlaying ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center flex items-center justify-center cursor-pointer"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600')" }}
                  onClick={() => setIsPlaying(true)}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all"></div>
                  <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform relative z-10 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-primary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center gap-3 z-10">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">favorite</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-label-md text-white text-sm truncate">Video 1</p>
                      <p className="font-label-sm text-gray-300 text-xs truncate">Toca para ver</p>
                    </div>
                  </div>
                </div>
              ) : (
                <iframe 
                  src="https://www.youtube.com/embed/TU_VIDEO_ID_1?autoplay=1" 
                  title="Video 1 Hook"
                  className="w-full h-full border-0"
                  allow="autoplay"
                ></iframe>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Prueba de producto: los códigos que se entregan, uno por estilo */}
        <div className="mt-14 md:mt-20">
          <QrShowcase />
        </div>
      </div>
    </section>
  );
};