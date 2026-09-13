import React from 'react';
import { slugify } from '../legalDocument';

/**
 * Renderizador mínimo de Markdown para los textos legales.
 *
 * Cubre lo que estos documentos usan y nada más: títulos, subtítulos, listas,
 * negritas, separadores y párrafos. Traer una librería de Markdown por seis
 * etiquetas sería pagar un bundle entero por nada —el mismo criterio con el
 * que ya se pintaba el texto dentro del modal de compra, que ahora reutiliza
 * este componente en vez de tener su propia copia.
 *
 * Los correos y las URL se vuelven enlaces solos. En un documento legal eso no
 * es adorno: el canal de PQR y el enlace a la SIC tienen que poder pulsarse.
 */

/**
 * Cierra en un carácter "de contenido" para no tragarse el punto que termina la
 * frase. El asterisco también queda fuera: aquí las negritas se parten antes,
 * pero una URL escrita sin negrita se llevaría los `**` de la siguiente.
 */
const LINK_RE = /(https?:\/\/[^\s<>()*]*[^\s<>().,;:*]|[\w.+-]+@[\w-]+\.[\w.-]*[\w-])/g;

const linkify = (text: string, keyPrefix: string): React.ReactNode[] =>
  text.split(LINK_RE).map((piece, index) => {
    if (index % 2 === 0) return <React.Fragment key={`${keyPrefix}-t${index}`}>{piece}</React.Fragment>;

    const isEmail = !piece.startsWith('http');
    return (
      <a
        key={`${keyPrefix}-l${index}`}
        href={isEmail ? `mailto:${piece}` : piece}
        {...(isEmail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        className="text-wine font-medium underline decoration-wine/35 underline-offset-2 hover:decoration-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine rounded-xs break-words"
      >
        {piece}
      </a>
    );
  });

/** Negritas primero y enlaces dentro de cada trozo: así un correo en negrita sigue siendo enlace. */
const inline = (text: string, keyPrefix: string): React.ReactNode[] =>
  text.split(/\*\*(.+?)\*\*/g).map((piece, index) =>
    index % 2 === 1 ? (
      <strong key={`${keyPrefix}-b${index}`} className="font-semibold text-wine-deep">
        {linkify(piece, `${keyPrefix}-b${index}`)}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-p${index}`}>{linkify(piece, `${keyPrefix}-p${index}`)}</React.Fragment>
    ),
  );

/** Un salto simple dentro de un párrafo es un salto de línea, no un párrafo nuevo. */
const withLineBreaks = (text: string, keyPrefix: string): React.ReactNode[] =>
  text.split('\n').flatMap((line, index) =>
    index === 0
      ? inline(line, `${keyPrefix}-${index}`)
      : [<br key={`${keyPrefix}-br${index}`} />, ...inline(line, `${keyPrefix}-${index}`)],
  );

const Block: React.FC<{ text: string; index: number; compact: boolean }> = ({
  text,
  index,
  compact,
}) => {
  const key = `b${index}`;

  if (text === '---') {
    return <hr className="my-7 border-0 h-px bg-linear-to-r from-transparent via-wine/20 to-transparent" />;
  }

  if (text.startsWith('### ')) {
    const label = text.slice(4);
    return (
      <h3
        id={slugify(label)}
        className={`scroll-mt-24 font-headline-md font-bold text-wine ${
          compact ? 'text-sm mt-4 mb-1' : 'text-base md:text-lg mt-7 mb-2'
        }`}
      >
        {label}
      </h3>
    );
  }

  if (text.startsWith('## ')) {
    const label = text.slice(3);
    return (
      <h2
        id={slugify(label)}
        className={`scroll-mt-24 font-headline-md font-bold text-wine-deep ${
          compact ? 'text-base mt-5 mb-1.5' : 'text-lg md:text-xl mt-9 mb-3'
        }`}
      >
        {label}
      </h2>
    );
  }

  if (text.startsWith('# ')) {
    return (
      <h1 className="font-headline-md text-xl md:text-2xl font-bold text-wine-deep mb-3">
        {text.slice(2)}
      </h1>
    );
  }

  if (text.startsWith('- ')) {
    return (
      <ul className="my-3 space-y-1.5 pl-1">
        {text.split('\n').map((line, lineIndex) => (
          <li key={`${key}-i${lineIndex}`} className="flex gap-2.5">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-wine/45" />
            <span className="min-w-0">{inline(line.replace(/^-\s*/, ''), `${key}-i${lineIndex}`)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <p className={compact ? 'my-2 leading-relaxed' : 'my-3 leading-[1.75]'}>{withLineBreaks(text, key)}</p>;
};

interface LegalMarkdownProps {
  markdown: string;
  /** Escala reducida para el modal de compra, donde el alto es escaso. */
  compact?: boolean;
}

export const LegalMarkdown: React.FC<LegalMarkdownProps> = ({ markdown, compact = false }) => (
  <>
    {markdown
      .split('\n\n')
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, index) => (
        <Block key={index} text={block} index={index} compact={compact} />
      ))}
  </>
);
