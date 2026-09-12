import React from 'react';
import { Ornament, CornerFlourish, HeartConfetti, Bow, PhotoFrame } from '../../../../components/decor';
import { YouTubeFacade } from '../../../../components/media/YouTubeFacade';
import { LANDING_VIDEOS } from '../../../../config/videos';

/** Lo que se lleva quien compra, tal como lo promete la tarjeta. */
const BENEFITS = [
  'Código QR físico en alta resolución directo a tu correo',
  'Inmersión total: su música favorita, fotos y tu carta sin límites',
  'Alojamiento vitalicio: lo pagas hoy, ella lo guarda para siempre',
] as const;

interface PricingProps {
  /** Abre el flujo de compra. La landing es quien monta el modal. */
  onBuy: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onBuy }) => {
  return (
    <section className="py-14 md:py-section-gap bg-paper-deep/60 relative overflow-hidden paper-grain scroll-mt-32" id="pricing">
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
          <div className="w-full lg:max-w-[460px] lg:mx-auto bg-white rounded-4xl p-6 md:p-8 pt-12 md:pt-11 shadow-2xl border border-wine/15 relative text-center ambient-shadow-lg z-10 lg:order-2">
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
            
            <span className="inline-block bg-blush text-wine-deep font-label-sm px-4 py-1.5 rounded-full mb-6 md:mb-4 ring-1 ring-wine/15 uppercase tracking-wider">
              Esto no es una compra
            </span>
            
            <h2 className="font-headline-md text-on-background mb-2">
              Un recuerdo para toda la vida, por el precio de una{' '}
              <span className="font-script font-normal text-wine text-[1.4em] leading-none">
                cena rápida
              </span>
            </h2>
            <Ornament tone="gold" width={180} className="mx-auto mb-3" />
            <p className="font-body-md text-on-surface-variant mb-6">
              Es la decisión de 2 minutos que ella no va a olvidar en toda su vida.
            </p>
            
            {/* Contenedor de Precios */}
            <div className="text-center my-4">
              
              {/* Precio tachado más visible */}
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xl font-display-lg text-on-surface-variant line-through opacity-60">
                  $90.000 COP
                </span>
              </div>
              
              {/* Precio principal grande y destacado */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-5xl font-display-lg font-bold text-wine">
                  $30.000
                </span>
                <span className="font-label-md text-on-surface-variant mt-3">
                  COP
                </span>
              </div>
              <p className="font-label-sm text-on-surface-variant">
                Un solo pago. Para toda la vida.
              </p>

            </div>
            
            <ul className="flex flex-col gap-3.5 md:gap-3 text-left font-body-md text-on-surface-variant my-8 md:my-6 w-fit mx-auto">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-3 max-w-xs">
                  <span
                    className="material-symbols-outlined text-wine text-[20px] shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            
            {/* Botón brillante original */}
            <button type="button" onClick={onBuy} className="w-full relative group cursor-pointer">
              <div className="absolute -inset-1 bg-linear-to-r from-primary to-tertiary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative bg-wine hover:bg-primary text-white font-label-md text-lg md:text-base py-4 md:py-3.5 px-8 rounded-full transition-all shadow-lg flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">lock</span>
                Asegurar Mi Código Único
              </div>
            </button>
            
            <p className="font-label-sm text-outline mt-6 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              Pago 100% encriptado vía Mercado Pago
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};