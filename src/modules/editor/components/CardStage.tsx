import React from 'react';
import { HeartConfetti, Rose } from '../../../components/decor';
import { stageColors, stageRoseColors } from '../../../utils/stageTheme';
import type { ThemePalette } from '../../../utils/themePalette';

/**
 * Lo que rodea al teléfono cuando la carta se abre a pantalla completa.
 *
 * Antes era un plano gris pizarra: la carta llegaba desde un correo o un QR y
 * lo primero que se veía era una pantalla de aplicación a medio hacer. Aquí se
 * presenta como lo que es —una pieza apoyada sobre una mesa con luz— y el
 * fondo sigue al tema: los rubores salen de la paleta, las rosas y los
 * corazones se tiñen con ella, y un tema de noche cae sobre negro mientras uno
 * de papel cae sobre crema.
 *
 * Es el mismo escenario del HTML descargable, con los mismos colores
 * (`utils/stageTheme`): abrir la carta desde el enlace y abrirla desde el
 * archivo tienen que verse igual.
 *
 * Todo va con `pointer-events-none`: esto es decorado, y quien manda es la
 * carta que se apoya encima.
 */

interface CardStageProps {
  palette: ThemePalette;
  /** Para el rótulo suelto de arriba. Sin él, no se pinta. */
  recipient?: string;
  children: React.ReactNode;
}

export const CardStage: React.FC<CardStageProps> = ({ palette, recipient, children }) => {
  const stage = stageColors(palette);
  const rose = stageRoseColors(palette);

  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: stage.base }}
    >
      {/* Dos rubores en diagonal: dan profundidad sin dibujar nada */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            `radial-gradient(48% 42% at 22% 28%, ${stage.glow1} 0%, transparent 70%),` +
            `radial-gradient(52% 46% at 80% 74%, ${stage.glow2} 0%, transparent 70%)`,
          filter: 'blur(28px)',
        }}
      />

      {/* Grano: quita el aspecto de degradado plano de pantalla */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(rgba(94,10,27,0.06) 0.5px, transparent 0.5px),' +
            'radial-gradient(rgba(94,10,27,0.04) 0.5px, transparent 0.5px)',
          backgroundSize: '13px 13px, 21px 21px',
          backgroundPosition: '0 0, 7px 9px',
        }}
      />

      {/*
        Corazones y rosas solo de 640px arriba. En el móvil el teléfono ocupa
        la pantalla entera y no queda escenario que decorar: dibujarlos ahí es
        pintar debajo de algo opaco.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
        <span style={{ color: stage.confetti }}>
          <HeartConfetti count={22} tone={palette.isDark ? 'light' : 'rose'} opacity={0.5} float />
        </span>
        <Rose
          size={132}
          color={rose.petal}
          leaf={rose.leaf}
          className="absolute -bottom-5 left-[3%] opacity-[0.28] -rotate-[16deg]"
        />
        <Rose
          size={112}
          color={rose.petal}
          leaf={rose.leaf}
          className="absolute -bottom-5 right-[3%] opacity-[0.28] rotate-[20deg]"
        />
      </div>

      {/*
        El rotulo suelto, arriba. Pide pantalla ancha Y alta: en una baja se le
        echaria encima al telefono, que es lo unico que importa aqui.
      */}
      {recipient && (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[5vh] hidden -translate-x-1/2 text-center min-[900px]:[@media(min-height:940px)]:block"
          style={{ color: stage.ink }}
        >
          <span className="font-script text-[38px] leading-none">para {recipient}</span>
        </p>
      )}

      {children}

      {/* Viñeta: cierra los bordes para que la vista caiga en el centro */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(125% 90% at 50% 45%, transparent 52%, rgba(0,0,0,0.2) 100%)',
        }}
      />
    </div>
  );
};
