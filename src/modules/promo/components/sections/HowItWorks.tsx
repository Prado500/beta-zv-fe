import React from 'react';
import { Ornament, HeartConfetti, CornerFlourish } from '../../../../components/decor';
import { useMediaQuery } from '../../../../utils/useMediaQuery';
import { AutoMarquee } from '../ui/AutoMarquee';

interface Step {
  icon: string;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    icon: 'credit_card',
    title: 'Asegura tu lugar',
    text: 'Aparta tu código único antes de que se agoten los espacios. Un solo pago, sin letras pequeñas.',
  },
  {
    icon: 'construction',
    title: 'Construye la magia',
    text: 'Se abre tu portal privado. Eliges su estilo, subes las 5 fotos, pegas el enlace de la canción y escribes lo que te salga del corazón. Tan fácil como llenar tu perfil de Instagram.',
  },
  {
    icon: 'redeem',
    title: 'Recibe y sorprende',
    text: 'En minutos llega a tu correo el diseño premium con tu código QR en alta resolución, listo para imprimir, junto con los bonos. Tú solo encárgate de las flores.',
  },
];

/** La tarjeta de un paso. La comparten la rejilla y la cinta. */
const StepCard: React.FC<{ step: Step; index: number }> = ({ step, index }) => (
  <div className="relative h-full bg-white rounded-4xl p-6 md:p-7 pt-9 border border-wine/10 ambient-shadow text-center md:text-left">
    <CornerFlourish corner="tr" tone="gold" size={52} className="opacity-45" />

    {/* El número, en la esquina superior, montado sobre el borde */}
    <span className="absolute -top-4 left-1/2 -translate-x-1/2 md:left-7 md:translate-x-0 w-9 h-9 rounded-full bg-wine text-white font-bold flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(140,17,40,0.9)]">
      {index + 1}
    </span>

    <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-blush text-wine ring-1 ring-wine/10 mb-3.5">
      <span className="material-symbols-outlined text-[24px]">{step.icon}</span>
    </span>

    <h3 className="font-headline-sm text-on-background mb-1.5">{step.title}</h3>
    <p className="font-body-md text-on-surface-variant leading-relaxed">{step.text}</p>
  </div>
);

/**
 * Los tres pasos, entre la escasez y el precio: quien llega hasta aquí ya
 * quiere, y lo único que puede frenarlo es no saber qué tiene que hacer.
 *
 * En escritorio van en rejilla, que es donde los tres se ven de un vistazo.
 * En móvil, en una cinta que avanza sola.
 */
export const HowItWorks: React.FC = () => {
  const isWide = useMediaQuery('(min-width: 768px)');

  return (
  <section id="como-funciona" className="py-14 md:py-section-gap relative overflow-hidden scroll-mt-32">
    <div className="absolute top-0 inset-x-0 h-px rule-rose"></div>
    <HeartConfetti count={6} tone="rose" opacity={0.12} className="z-0" />

    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter relative z-10">
      <div className="text-center mb-10 md:mb-14">
        <h2 className="text-3xl md:text-5xl font-black text-on-background tracking-tight">
          Cómo funciona{' '}
          <span className="font-script font-normal text-wine text-[1.35em] leading-none">
            tu acceso
          </span>
        </h2>
        <Ornament tone="gold" className="mx-auto my-4" />
        <p className="max-w-xl mx-auto text-base md:text-lg text-on-surface-variant font-medium">
          Tu regalo listo en menos de 5 minutos. Cero complicaciones.
        </p>
      </div>

      {isWide ? (
        <ol className="grid md:grid-cols-3 gap-5 md:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <StepCard step={step} index={i} />
            </li>
          ))}
        </ol>
      ) : (
        /*
          En móvil los tres pasos se apilaban en más de 600 px y había que
          bajar mucho para ver el tercero. `padY` deja sitio al número, que
          asoma por encima del borde de la tarjeta y si no se recorta.
        */
        <AutoMarquee
          itemWidth={258}
          speed={26}
          padY={26}
          label="Cómo funciona tu acceso, paso a paso"
        >
          {STEPS.map((step, i) => (
            /* min-h iguala las tarjetas dentro de la cinta */
            <div key={step.title} className="h-full min-h-[288px]">
              <StepCard step={step} index={i} />
            </div>
          ))}
        </AutoMarquee>
      )}
    </div>
  </section>
  );
};
