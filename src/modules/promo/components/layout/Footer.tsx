import React from 'react';
import { Link } from 'react-router-dom';
import { CookieSettings } from '../../../../components/ui/CookieSettings';
import { Ornament, Rose } from '../../../../components/decor';
import { LEGAL_ROUTES } from '../../../legal/legalRoutes';

const FOOTER_LINK =
  'font-label-sm text-on-surface-variant hover:text-primary hover:underline transition-all focus:ring-2 focus:ring-primary rounded py-2.5 px-1';

export const Footer: React.FC = () => {
  return (
    <footer className="relative w-full border-t border-wine/15 bg-paper overflow-hidden">
      <Rose
        size={120}
        className="pointer-events-none absolute -left-6 -bottom-10 opacity-25 -rotate-12 hidden md:block"
      />
      <Rose
        size={100}
        className="pointer-events-none absolute -right-4 -bottom-8 opacity-20 rotate-[24deg] hidden md:block"
      />

      <div className="relative flex justify-center pt-stack-lg">
        <Ornament tone="gold" className="opacity-80" />
      </div>

      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg flex flex-col md:flex-row justify-between items-center gap-stack-md">
        <div className="font-script text-wine text-4xl leading-none pb-1">Eternal Dedications</div>
        <div className="font-body-md text-on-surface text-center md:text-left">
          © {new Date().getFullYear()} Eternal Dedications. All rights reserved. Crafted with intimacy.
        </div>
        {/* Enlaces legales obligatorios: rutas reales, no anclas muertas */}
        <nav aria-label="Enlaces legales" className="flex flex-wrap justify-center gap-x-5 gap-y-1">
          <Link className={FOOTER_LINK} to={LEGAL_ROUTES.privacy}>
            Política de privacidad
          </Link>
          <Link className={FOOTER_LINK} to={LEGAL_ROUTES.terms}>
            Términos y condiciones
          </Link>
          <a className={FOOTER_LINK} href="mailto:admin@zyvencore.com">
            Contáctanos
          </a>
          {/*
            La vuelta atrás del aviso de cookies. Va con los enlaces legales
            porque es donde se busca, y solo aparece cuando hay una decisión
            que revisar. Lleva `FOOTER_LINK` como sus vecinos, más lo que hace
            falta para que un `button` no se distinga de ellos.
          */}
          <CookieSettings className={`${FOOTER_LINK} cursor-pointer bg-transparent border-0`} />
        </nav>
      </div>
    </footer>
  );
};