import React from 'react';
import { Ornament } from '../../../components/decor';

/**
 * Datos de contacto y enlace a la SIC.
 *
 * Va al pie de los dos documentos y no dentro del Markdown de uno solo: quien
 * llega directo a la Política tiene que encontrar el canal de PQR y la vía de
 * reclamación ante la autoridad sin ir a buscarlos a la otra página.
 */

const ROWS = [
  { label: 'NIT', value: '902094491-8' },
  { label: 'Correo', value: 'admin@zyvencore.com', href: 'mailto:admin@zyvencore.com' },
  { label: 'Teléfono', value: '3226541957', href: 'tel:+573226541957' },
  { label: 'Dirección', value: 'cr 66 c No. 60-65, Bogotá, Colombia' },
  { label: 'Sitio web', value: 'https://zyexperience.com/', href: 'https://zyexperience.com/' },
] as const;

const LINK =
  'text-wine font-medium underline decoration-wine/35 underline-offset-2 hover:decoration-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine rounded-xs break-words';

export const LegalContact: React.FC = () => (
  <section
    aria-labelledby="legal-contacto"
    className="mt-10 rounded-3xl border border-wine/12 bg-white/80 p-5 sm:p-7 shadow-[0_18px_40px_-28px_rgba(94,10,27,0.4)]"
  >
    <div className="text-center">
      <h2 id="legal-contacto" className="font-headline-md text-lg md:text-xl font-bold text-wine-deep">
        ¿Dudas o solicitudes?{' '}
        <span className="font-script text-[1.35em] font-normal leading-none text-wine">escríbenos</span>
      </h2>
      <Ornament tone="gold" width={140} className="mx-auto mt-1.5" />
    </div>

    <p className="mt-4 text-center text-sm text-on-surface-variant">
      <strong className="font-semibold text-wine-deep">ZyvenCore S.A.S.</strong>
    </p>

    <dl className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
      {ROWS.map((row) => (
        <div key={row.label} className="flex flex-col sm:flex-row sm:gap-2 min-w-0">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-wine/70 sm:w-24 sm:shrink-0 sm:pt-px">
            {row.label}
          </dt>
          <dd className="min-w-0 text-sm text-on-surface-variant">
            {'href' in row ? (
              <a
                href={row.href}
                {...(row.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={LINK}
              >
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>

    <div className="mt-5 rounded-2xl border border-wine/12 bg-paper/70 p-4">
      <p className="text-sm leading-relaxed text-on-surface-variant">
        También puedes presentar quejas por protección de datos o por protección al consumidor ante
        la{' '}
        <a
          href="https://www.sic.gov.co/"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK}
        >
          Superintendencia de Industria y Comercio (SIC)
        </a>
        .
      </p>
    </div>
  </section>
);
