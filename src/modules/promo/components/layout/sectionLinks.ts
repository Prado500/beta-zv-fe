/**
 * Acceso rápido a cada sección de la landing, en el orden en que aparecen.
 *
 * Las etiquetas son cortas a propósito: son siete y tienen que caber en la
 * barra junto al logotipo, la sesión y el botón. Cada `href` apunta al `id` de
 * su sección, que además lleva `scroll-mt-32` para no quedar debajo de las dos
 * barras fijas al saltar. El desplazamiento suave lo pone `useSmoothAnchors`
 * desde la página.
 *
 * Vive fuera de `Header.tsx` para que la cabecera exporte solo el componente
 * y para que las pruebas puedan comprobar que cada destino existe.
 */
export interface SectionLink {
  href: `#${string}`;
  label: string;
}

export const SECTION_LINKS: readonly SectionLink[] = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#estilos', label: 'Estilos' },
  { href: '#preview', label: 'La carta' },
  { href: '#reacciones', label: 'Reacciones' },
  { href: '#cupos', label: 'Cupos' },
  { href: '#como-funciona', label: 'Pasos' },
  { href: '#pricing', label: 'Precio' },
];
