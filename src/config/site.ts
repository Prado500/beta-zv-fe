/**
 * Origen público de las cartas. En producción se fija con VITE_PUBLIC_BASE_URL
 * (por ejemplo https://zyexpirience.com); en desarrollo cae al origen actual,
 * así el QR apunta al servidor de Vite y se puede probar en el mismo equipo.
 */
export const PUBLIC_BASE_URL: string = (
  import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin
).replace(/\/+$/, '');

/** Ruta pública del visor de una carta. */
export const cardPath = (id: string): string => `/c/${id}`;

/** URL absoluta que se codifica en el QR y se comparte. */
export const cardUrlFor = (id: string): string => `${PUBLIC_BASE_URL}${cardPath(id)}`;
