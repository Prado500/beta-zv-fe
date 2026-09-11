import React from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Ornament } from '../../../components/decor';
import type { Terms } from '../services/legal';

/**
 * Los Términos, encima del modal de compra y sin navegar a ningún sitio.
 *
 * Esto es lo importante: el modal de compra **no se desmonta** mientras este está
 * abierto. Lo tecleado sigue puesto, el paso sigue siendo el mismo y —lo que de
 * verdad importa— la clave de idempotencia de la compra no se regenera. Mandar a la
 * persona a otra página, aunque volviera, crearía una compra distinta.
 *
 * El texto llega en Markdown y se pinta con un renderizador mínimo: solo títulos,
 * negritas, listas y párrafos, que es todo lo que el documento usa. Añadir una
 * librería de Markdown por cuatro etiquetas sería pagar un bundle entero por nada.
 */

interface TermsModalProps {
  terms: Terms;
  onClose: () => void;
}

/** Trocea el Markdown en bloques ya listos para pintar. */
const blocksOf = (markdown: string) =>
  markdown
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean);

const bold = (text: string) =>
  text.split(/\*\*(.+?)\*\*/g).map((piece, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-wine-deep">
        {piece}
      </strong>
    ) : (
      <React.Fragment key={index}>{piece}</React.Fragment>
    ),
  );

const Block: React.FC<{ text: string }> = ({ text }) => {
  if (text.startsWith('## ')) {
    return (
      <h3 className="font-headline-md text-base font-bold text-wine mt-5 mb-1.5">
        {text.slice(3)}
      </h3>
    );
  }
  if (text.startsWith('# ')) {
    return (
      <h2 className="font-headline-md text-lg font-bold text-wine-deep mb-2">{text.slice(2)}</h2>
    );
  }
  if (text.startsWith('- ')) {
    return (
      <ul className="list-disc pl-5 space-y-1 my-2">
        {text.split('\n').map((line, index) => (
          <li key={index}>{bold(line.replace(/^-\s*/, ''))}</li>
        ))}
      </ul>
    );
  }
  return <p className="my-2 leading-relaxed">{bold(text)}</p>;
};

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
      {blocksOf(terms.content).map((block, index) => (
        <Block key={index} text={block} />
      ))}
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
