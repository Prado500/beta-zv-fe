import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-paper/95 shadow-sm border-b border-wine/10">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter h-14 md:h-16 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#D4AF37] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <span className="font-script text-wine text-2xl md:text-3xl leading-none pb-1">Eternal Dedications</span>
        </div>
        <nav className="hidden md:flex gap-6 items-center">
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Inicio</a>
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Gallery</a> */}
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Features</a> */}
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#pricing">Precio</a>
          {/* Ruta de la app, no ancla de la landing: va con `Link` para no recargar la página */}
          <Link className="font-label-md text-on-surface-variant hover:text-primary transition-colors" to="/mis-dedicatorias">Mis Dedicatorias</Link>
        </nav>
        <a className="font-label-md font-medium text-white bg-primary hover:bg-primary-container px-6 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hidden md:inline-flex items-center gap-2" href="#pricing">
          Comienza a escribir
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </a>
        <button 
          className="md:hidden text-wine p-3 -mr-2 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Hairline dorado que separa el header del contenido */}
      <div className="h-px w-full rule-gold"></div>

      {/* Menú desplegable responsive */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white border-b border-wine/10 px-5 py-3 flex flex-col gap-1">
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg" href="#" onClick={() => setIsMobileMenuOpen(false)}>Inicio</a>
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#" onClick={() => setIsMobileMenuOpen(false)}>Gallery</a> */}
          {/* <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors" href="#" onClick={() => setIsMobileMenuOpen(false)}>Features</a> */}
          <a className="font-label-md text-on-surface-variant hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg" href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Precio</a>
          <Link className="font-label-md text-on-surface-variant hover:text-primary transition-colors py-3 px-2 -mx-2 rounded-lg" to="/mis-dedicatorias" onClick={() => setIsMobileMenuOpen(false)}>Mis Dedicatorias</Link>
          <a className="font-label-md font-medium text-white bg-wine hover:bg-primary px-6 py-3.5 rounded-full text-center transition-all flex items-center justify-center gap-2 mt-1" href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>
            Empezar ahora
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </a>
        </nav>
      )}
    </header>
  );
};