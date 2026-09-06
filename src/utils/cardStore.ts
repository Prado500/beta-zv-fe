import type { DedicationForm } from '../modules/editor/types';

const PREFIX = 'zy:card:';

export interface StoredCard {
  id: string;
  createdAt: string;
  data: DedicationForm;
}

export class CardStorageFullError extends Error {
  /** Tamaño aproximado de la carta que no cupo, en KB. */
  readonly sizeKb: number;

  constructor(sizeKb: number) {
    super('No hay espacio para guardar la dedicatoria en este navegador.');
    this.name = 'CardStorageFullError';
    this.sizeKb = sizeKb;
  }
}

/** Claves de cartas guardadas, en orden de aparición. */
const cardKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
};

/**
 * Almacén local de dedicatorias.
 *
 * OJO: esto es un sustituto del backend, no el backend. Una carta guardada aquí
 * sólo existe en el navegador que la creó, así que el enlace y el QR no abren
 * nada en otro dispositivo. Cuando exista la API, `publishDedication` es el
 * único punto que hay que cambiar; este módulo pasa a ser caché o desaparece.
 *
 * El techo de localStorage ronda los 5 MB y las fotos viajan en base64, que
 * abulta un tercio más que el archivo original. Con varias fotos grandes no
 * cabe ni una carta: ahí hace falta IndexedDB o directamente el servidor.
 */
export const saveCard = (id: string, data: DedicationForm): StoredCard => {
  const record: StoredCard = { id, createdAt: new Date().toISOString(), data };
  const payload = JSON.stringify(record);
  const key = `${PREFIX}${id}`;

  try {
    localStorage.setItem(key, payload);
    return record;
  } catch {
    // Purga las demás cartas y reintenta. Antes cada publicación dejaba su
    // propio registro con todas las fotos, y a la segunda o tercera se llenaba.
    for (const other of cardKeys()) {
      if (other !== key) localStorage.removeItem(other);
    }

    try {
      localStorage.setItem(key, payload);
      return record;
    } catch {
      throw new CardStorageFullError(Math.round(payload.length / 1024));
    }
  }
};

export const loadCard = (id: string): StoredCard | null => {
  try {
    const raw = localStorage.getItem(`${PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as StoredCard) : null;
  } catch {
    return null;
  }
};

export const removeCard = (id: string): void => {
  localStorage.removeItem(`${PREFIX}${id}`);
};
