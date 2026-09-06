import React from 'react';
import { SPOTS, formatSpots } from '../../../../config/campaign';

export const ScarcityBar: React.FC = () => {
  return (
    <div className="relative w-full bg-linear-to-r from-wine-deep via-wine to-primary text-white py-1.5 md:py-2 px-3 text-center text-xs md:text-sm font-label-md shadow-md overflow-hidden">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 14px)' }}
      ></div>
      <span className="relative inline-flex items-center justify-center gap-1.5 md:gap-2 animate-pulse leading-tight">
        <span
          className="material-symbols-outlined text-[16px] md:text-[20px] shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          local_fire_department
        </span>
        {/* En móvil el texto largo se partía en tres líneas dentro de una barra fija */}
        <span className="md:hidden">Quedan {formatSpots(SPOTS.remaining)} cupos</span>
        <span className="hidden md:inline">
          TENDENCIA NACIONAL: Solo quedan {formatSpots(SPOTS.remaining)} unidades disponibles
        </span>
        <span
          className="material-symbols-outlined text-[16px] md:text-[20px] shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          local_fire_department
        </span>
      </span>
    </div>
  );
};