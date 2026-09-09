import React from 'react';
import { Ornament, CornerFlourish, HeartConfetti, Bow, PhotoFrame } from '../../../../components/decor';
import { YouTubeFacade } from '../../../../components/media/YouTubeFacade';
import { LANDING_VIDEOS } from '../../../../config/videos';

interface PricingProps {
  /** Abre el flujo de compra. La landing es quien monta el modal. */
  onBuy: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onBuy }) => {
  return (
    <section className="py-14 md:py-section-gap bg-paper-deep/60 relative overflow-hidden paper-grain" id="pricing">
      <div className="absolute top-0 inset-x-0 h-px rule-gold"></div>
      <HeartConfetti count={8} tone="rose" opacity={0.15} className="z-0" />

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter relative z-10">
        
        <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
          
          {/* Video 6 (Paralelo al precio) */}
          <PhotoFrame caption="el último empujón" tilt={-2} tape="left" className="lg:order-1">
            <div className="aspect-video">
              <YouTubeFacade videoId={LANDING_VIDEOS.closing} title="Video 6 Cierre" />
            </div>
          </PhotoFrame>

          {/* Tu Tarjeta Original de Precios (Restaurada por completo) */}
          <div className="w-full bg-white rounded-4xl p-6 md:p-12 pt-12 md:pt-14 shadow-2xl border border-wine/15 relative text-center ambient-shadow-lg z-10 lg:order-2">
            <div
              className="absolute inset-0 rounded-4xl overflow-hidden pointer-events-none"
              aria-hidden="true"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-wine-deep via-wine to-tertiary"></div>
            </div>

            {/* Lazo puesto encima de la tarjeta, como en un regalo */}
            <Bow size={112} className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_8px_14px_rgba(94,10,27,0.3)]" />

            {/* Filigrana en las cuatro esquinas de la tarjeta */}
            <CornerFlourish corner="tl" tone="gold" size={64} className="opacity-75" />
            <CornerFlourish corner="tr" tone="gold" size={64} className="opacity-75" />
            <CornerFlourish corner="bl" tone="gold" size={64} className="opacity-75" />
            <CornerFlourish corner="br" tone="gold" size={64} className="opacity-75" />
            
            <span className="inline-block bg-blush text-wine-deep font-label-sm px-4 py-1.5 rounded-full mb-6 ring-1 ring-wine/15">
              Oferta por tiempo limitado
            </span>
            
            <h2 className="font-headline-md text-on-background mb-2">
              Un pago único,{' '}
              <span className="font-script font-normal text-wine text-[1.4em] leading-none">para siempre</span>
            </h2>
            <Ornament tone="gold" width={180} className="mx-auto mb-3" />
            <p className="font-body-md text-on-surface-variant mb-6">Tu dedicatoria alojada eternamente. Sin suscripciones.</p>
            
            {/* Contenedor de Precios */}
            <div className="text-center my-4">
              
              {/* Precio tachado más visible */}
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xl md:text-2xl font-display-lg text-on-surface-variant line-through opacity-60">
                  $90.000 COP
                </span>
              </div>
              
              {/* Precio principal grande y destacado */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-5xl md:text-6xl font-display-lg font-bold text-wine">
                  $30.000
                </span>
                <span className="font-label-md text-on-surface-variant mt-3">
                  COP
                </span>
              </div>

            </div>
            
            <ul className="flex flex-col gap-4 text-left font-body-md text-on-surface-variant mb-8 w-fit mx-auto">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-wine text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                Código QR HD en tu correo
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-wine text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                Música, fotos y texto sin límite
              </li>
            </ul>
            
            {/* Botón brillante original */}
            <button type="button" onClick={onBuy} className="w-full relative group cursor-pointer">
              <div className="absolute -inset-1 bg-linear-to-r from-primary to-tertiary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative bg-wine hover:bg-primary text-white font-label-md text-lg py-4 px-8 rounded-full transition-all shadow-lg flex items-center justify-center gap-2">
                Hacer Plantilla Ahora
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </button>
            
            <p className="font-label-sm text-outline mt-6 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Pago 100% seguro y encriptado
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};