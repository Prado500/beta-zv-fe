import React, { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { HeartConfetti, Ornament, Rose } from '../../../components/decor';
import { Footer } from '../../promo/components/layout/Footer';
import { LEGAL_TABS } from '../legalRoutes';
import { parseLegalDocument } from '../legalDocument';
import { LegalMarkdown } from './LegalMarkdown';
import { LegalContact } from './LegalContact';

interface LegalPageLayoutProps {
  /** Markdown completo del documento, tal cual está en `content/`. */
  markdown: string;
}

/**
 * Armazón común de los dos documentos legales.
 *
 * El índice va pegado al lado en escritorio y plegado en móvil: son textos de
 * doce y trece apartados, y sin índice la única forma de llegar al de garantía
 * es desplazarse a ojo.
 */
export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ markdown }) => {
  const { pathname, hash } = useLocation();
  const doc = parseLegalDocument(markdown);

  /*
   * Al cambiar de documento se vuelve arriba. Sin esto, saltar de Términos a
   * Privacidad desde el índice deja la página a media altura, en mitad de un
   * apartado que no es el que se pidió.
   */
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <div className="relative flex min-h-screen flex-col paper-sheet paper-vignette text-on-background">
      <HeartConfetti count={14} tone="rose" opacity={0.04} fixed className="z-0" />

      {/* Cabecera propia: en un documento legal no cabe la navegación de venta */}
      <header className="sticky top-0 z-40 w-full border-b border-wine/10 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="group flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="material-symbols-outlined shrink-0 text-[18px] text-[#D4AF37] transition-transform group-hover:scale-110"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="truncate font-script text-2xl leading-none text-wine">
              Eternal Dedications
            </span>
          </Link>

          <Link
            to="/"
            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-2 text-xs font-semibold text-wine transition-colors hover:text-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Volver
          </Link>
        </div>
        <div className="h-px w-full rule-gold" />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* ---- Portada ---- */}
        <div className="relative text-center">
          <Rose
            size={86}
            className="pointer-events-none absolute -left-4 -top-4 hidden opacity-20 -rotate-[18deg] lg:block"
          />
          <Rose
            size={72}
            className="pointer-events-none absolute -right-2 top-0 hidden opacity-15 rotate-[22deg] lg:block"
          />

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wine/65">
            Información legal
          </p>

          <h1 className="mx-auto mt-2 max-w-3xl text-balance font-headline-md text-xl leading-tight font-bold tracking-tight text-wine-deep sm:text-2xl md:text-3xl">
            {doc.title}
          </h1>

          {doc.subtitle && (
            <p className="mt-2 text-sm text-on-surface-variant sm:text-base">{doc.subtitle}</p>
          )}

          <Ornament tone="gold" className="mx-auto mt-3" />

          {(doc.version || doc.publishedAt) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {doc.version && (
                <span className="rounded-full bg-blush/70 px-3 py-1 text-[11px] font-semibold text-wine-deep ring-1 ring-wine/10">
                  Versión {doc.version}
                </span>
              )}
              {doc.publishedAt && (
                <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-wine/75 ring-1 ring-wine/10">
                  Publicada el {doc.publishedAt}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ---- Cambio entre los dos documentos ---- */}
        <nav
          aria-label="Documentos legales"
          className="mx-auto mt-7 flex max-w-md gap-1 rounded-full border border-wine/15 bg-white/70 p-1 shadow-xs"
        >
          {LEGAL_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex-1 rounded-full px-3 py-2.5 text-center text-xs font-semibold transition-colors ${
                  isActive ? 'bg-wine text-white shadow-sm' : 'text-wine/70 hover:text-wine'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
          {/* ---- Índice ---- */}
          {doc.sections.length > 0 && (
            <>
              {/* Móvil: plegado, sin JavaScript */}
              <details className="mb-6 rounded-2xl border border-wine/12 bg-white/70 lg:hidden">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-wine-deep marker:content-none">
                  <span className="flex items-center justify-between gap-2">
                    Contenido
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-wine/60">
                      expand_more
                    </span>
                  </span>
                </summary>
                <ol className="space-y-0.5 border-t border-wine/10 px-2 pb-2 pt-2">
                  {doc.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block rounded-lg px-2 py-2 text-[13px] text-on-surface-variant hover:bg-blush/50 hover:text-wine"
                      >
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>

              {/* Escritorio: pegado al margen mientras se lee */}
              <nav aria-label="Contenido del documento" className="hidden lg:block">
                <div className="sticky top-24">
                  <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-wine/65">
                    Contenido
                  </p>
                  <ol className="max-h-[calc(100vh-9rem)] space-y-0.5 overflow-y-auto pr-1">
                    {doc.sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="block rounded-lg px-2 py-1.5 text-[13px] leading-snug text-on-surface-variant transition-colors hover:bg-blush/50 hover:text-wine"
                        >
                          {section.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            </>
          )}

          {/* ---- Documento ---- */}
          <article className="min-w-0 rounded-3xl border border-wine/12 bg-white/85 px-5 py-6 text-[15px] text-on-surface-variant shadow-[0_24px_60px_-40px_rgba(94,10,27,0.5)] sm:px-8 sm:py-8">
            <LegalMarkdown markdown={doc.body} />
          </article>
        </div>

        <LegalContact />
      </main>

      <Footer />
    </div>
  );
};
