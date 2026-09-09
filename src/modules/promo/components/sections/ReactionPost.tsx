import React from 'react';
import { YouTubeFacade } from '../../../../components/media/YouTubeFacade';

export interface Reaction {
  id: string;
  /** Nombre que se muestra en la cabecera del post. */
  name: string;
  /** Arroba de la autora. */
  handle: string;
  quote: string;
  /** ID del video de YouTube con su reacción. */
  videoId: string;
}

/** Iniciales para el avatar cuando no hay foto. */
const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/**
 * Testimonio con forma de publicación: cabecera con autora, video vertical y
 * pie con el comentario. El video no se monta hasta que se toca —tres iframes
 * de YouTube cargando a la vez pesan más que toda la página—; la fachada es
 * la misma que usan el resto de videos de la landing.
 */
export const ReactionPost: React.FC<{ reaction: Reaction }> = ({ reaction }) => (
  <article className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_20px_45px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/15 text-left">
    {/* Cabecera */}
    <header className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0 p-[2px] rounded-full bg-linear-to-br from-[#D4AF37] via-primary to-wine">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-wine text-xs font-bold ring-2 ring-white">
          {initials(reaction.name)}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-on-background leading-tight truncate">
          {reaction.name}
        </span>
        <span className="block text-xs text-wine/60 leading-tight truncate">{reaction.handle}</span>
      </span>
      <span className="material-symbols-outlined text-wine/40 text-[20px]">more_horiz</span>
    </header>

    {/* Video vertical */}
    <div className="relative bg-wine-deep aspect-[4/5]">
      <YouTubeFacade videoId={reaction.videoId} title={`Reacción de ${reaction.name}`} playSize="md">
        <span className="absolute inset-0 bg-linear-to-t from-wine-deep/70 via-transparent to-transparent"></span>
      </YouTubeFacade>
    </div>

    {/* Barra de acciones: lenguaje visual del formato, sin métricas inventadas */}
    <div className="flex items-center gap-4 px-4 pt-3 text-wine">
      <span
        className="material-symbols-outlined text-[21px] text-primary"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        favorite
      </span>
      <span className="material-symbols-outlined text-[21px]">mode_comment</span>
      <span className="material-symbols-outlined text-[21px]">send</span>
      <span className="material-symbols-outlined text-[21px] ml-auto">bookmark</span>
    </div>

    {/* Comentario */}
    <p className="px-4 pt-2 pb-4 text-sm text-on-background leading-relaxed">
      <span className="font-bold">{reaction.handle} </span>
      {reaction.quote}
    </p>
  </article>
);
