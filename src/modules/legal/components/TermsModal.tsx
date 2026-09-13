import React from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Ornament } from '../../../components/decor';
import type { Terms } from '../services/legal';
import { LegalMarkdown } from './LegalMarkdown';

/**
 * Los Términos, encima del modal de compra y sin navegar a ningún sitio.
 *
 * Esto es lo importante: el modal de compra **no se desmonta** mientras este está
 * abierto. Lo tecleado sigue puesto, el paso sigue siendo el mismo y —lo que de
 * verdad importa— la clave de idempotencia de la compra no se regenera. Mandar a la
 * persona a otra página, aunque volviera, crearía una compra distinta.
 *
 * El texto llega en Markdown y se pinta con `LegalMarkdown`, el mismo
 * renderizador mínimo que usan las páginas `/terminos` y `/privacidad`. Añadir
 * una librería de Markdown por cuatro etiquetas sería pagar un bundle entero
 * por nada, y tener dos renderizadores haría que el texto que se acepta aquí
 * no se viera igual que el publicado.
 */

interface TermsModalProps {
  terms: Terms;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ terms, onClose }) => (
  <ModalShell labelledBy="terms-title" onClose={onClose} size="lg" layer="over">
    <div className="text-center mb-4">
      <h2 id="terms-title" className="font-headline-md text-xl font-bold text-on-background">
        Términos y{' '}
        <span className="font-script font-normal text-wine text-[1.6em] leading-none">
          privacidad
        </span>
      </h2>
      <Ornament tone="gold" width={140} className="mx-auto mt-1" />
      <p className="text-xs text-wine/60 mt-2">Versión {terms.version}</p>
    </div>

    {/*
      Alto acotado y scroll propio: el texto es largo y, sin esto, el modal crecería
      hasta sacar el botón de cerrar fuera de la pantalla en un móvil.
    */}
    <div className="max-h-[55vh] overflow-y-auto pr-2 text-sm text-on-surface-variant">
      <LegalMarkdown markdown={terms.content} compact />
    </div>

    <button
      type="button"
      onClick={onClose}
      className="mt-5 w-full py-3 rounded-full bg-wine text-white font-semibold text-sm shadow-lg hover:bg-primary transition-colors cursor-pointer"
    >
      Entendido, volver
    </button>
  </ModalShell>
);
