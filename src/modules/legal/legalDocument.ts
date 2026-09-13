/**
 * Lectura de un documento legal en Markdown.
 *
 * Los textos viven como `.md` literales en `content/` y se importan con `?raw`.
 * Es a propósito: un documento legal se revisa comparándolo contra el oficial,
 * y si estuviera troceado en JSX cada revisión obligaría a leer el marcado en
 * vez del texto. Aquí solo se separa la portada del cuerpo para que la página
 * pinte el título en su cabecera; no se recorta nada.
 */

export interface LegalSection {
  /** Ancla para el enlace profundo y el índice. */
  id: string;
  label: string;
}

export interface LegalDocument {
  title: string;
  subtitle?: string;
  version?: string;
  publishedAt?: string;
  /** Markdown desde la primera sección numerada. */
  body: string;
  sections: LegalSection[];
}

/** Ancla legible y estable: sin tildes, sin signos, separada por guiones. */
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const parseLegalDocument = (markdown: string): LegalDocument => {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? 'Documento legal';
  // El primer `##` sin número es el subtítulo de portada; los numerados ya son secciones.
  const subtitle = markdown.match(/^##\s+(?!\d)(.+)$/m)?.[1].trim();
  const version = markdown.match(/^\*\*Versión:\*\*\s*(.+)$/m)?.[1].trim();
  const publishedAt = markdown.match(/^\*\*Fecha de publicación:\*\*\s*(.+)$/m)?.[1].trim();

  const bodyStart = markdown.search(/^##\s+\d/m);
  const body = bodyStart >= 0 ? markdown.slice(bodyStart) : markdown;

  const sections = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => {
    const label = match[1].trim();
    return { id: slugify(label), label };
  });

  return { title, subtitle, version, publishedAt, body, sections };
};
