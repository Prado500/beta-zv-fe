import type { DedicationState } from '../services/dedications';

/**
 * Diccionario de estados del panel, calcado del handoff del backend.
 *
 * Son dos y solo dos. El `Record` es exhaustivo a propósito: si mañana el
 * backend inventara un tercero, esto dejaría de compilar en vez de pintar una
 * tarjeta sin insignia. Y el vocabulario no se traduce a otro propio
 * ("completada", "pendiente"): `draft` es un borrador y `published` es una carta
 * publicada, aquí y en `letters.status`.
 */

export interface StateMeta {
  /** Insignia de la tarjeta. */
  label: string;
  /** Qué significa, en una frase que la persona entiende sin leer el contrato. */
  hint: string;
  icon: string;
  badgeClass: string;
}

export const DEDICATION_STATES: Record<DedicationState, StateMeta> = {
  // Pagó y no terminó: compra sin carta, o carta que quedó en borrador.
  draft: {
    label: 'Borrador',
    hint: 'Pagada, sin terminar',
    icon: 'edit_note',
    badgeClass: 'bg-blush text-wine-deep ring-1 ring-wine/15',
  },
  // Terminada y publicada. Se conserva aunque la compra se anule después.
  published: {
    label: 'Publicada',
    hint: 'Terminada y con enlace',
    icon: 'verified',
    badgeClass: 'bg-[#D4AF37]/15 text-[#7a5a0a] ring-1 ring-[#D4AF37]/40',
  },
};
