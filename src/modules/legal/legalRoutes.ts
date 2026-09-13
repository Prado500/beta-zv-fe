/**
 * Rutas de los documentos legales, en un solo sitio.
 *
 * Las enlazan el pie de página, el aviso de cookies y el modal de compra; con
 * la ruta escrita a mano en cada uno, renombrar una obligaría a acordarse de
 * los tres.
 */
export const LEGAL_ROUTES = {
  terms: '/terminos',
  privacy: '/privacidad',
} as const;

export const LEGAL_TABS = [
  { to: LEGAL_ROUTES.terms, label: 'Términos y condiciones' },
  { to: LEGAL_ROUTES.privacy, label: 'Política de privacidad' },
] as const;
