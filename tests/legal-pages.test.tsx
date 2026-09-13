import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TermsPage from '../src/modules/legal/page/TermsPage';
import PrivacyPage from '../src/modules/legal/page/PrivacyPage';
import { LEGAL_ROUTES } from '../src/modules/legal/legalRoutes';
import { parseLegalDocument } from '../src/modules/legal/legalDocument';
import { LegalMarkdown } from '../src/modules/legal/components/LegalMarkdown';
import { TermsModal } from '../src/modules/legal/components/TermsModal';
import { setupUser } from './testUtils';
import terms from '../src/modules/legal/content/terminos-y-condiciones.md?raw';
import privacy from '../src/modules/legal/content/politica-de-privacidad.md?raw';

/**
 * Los textos legales publicados.
 *
 * Lo que se fija aquí no es el diseño, es lo que la ley obliga a que esté y a
 * que se pueda pulsar: la identificación de la sociedad, el canal de PQR y la
 * vía de reclamación ante la SIC. Si alguien reordena la página, estos siguen
 * teniendo que aparecer.
 */

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={LEGAL_ROUTES.terms} element={<TermsPage />} />
        <Route path={LEGAL_ROUTES.privacy} element={<PrivacyPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('páginas legales', () => {
  it('son dos documentos distintos, cada uno en su ruta', () => {
    const { unmount } = renderAt(LEGAL_ROUTES.terms);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('TÉRMINOS Y CONDICIONES');
    // El texto de la otra no viaja de polizón en esta
    expect(screen.queryByText(/Responsable del Tratamiento de los datos personales/)).toBeNull();
    unmount();

    renderAt(LEGAL_ROUTES.privacy);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('POLÍTICA DE TRATAMIENTO');
  });

  it('muestra la versión vigente del documento', () => {
    renderAt(LEGAL_ROUTES.terms);
    expect(screen.getByText('Versión 1.1')).toBeTruthy();
    expect(screen.getByText(/12 de septiembre de 2026/)).toBeTruthy();
  });

  it.each([
    ['términos', LEGAL_ROUTES.terms],
    ['privacidad', LEGAL_ROUTES.privacy],
  ])('en %s, el correo de PQR y la SIC son enlaces pulsables', (_name, path) => {
    renderAt(path);

    const mails = screen.getAllByRole('link', { name: 'admin@zyvencore.com' });
    expect(mails.length).toBeGreaterThan(0);
    expect(mails[0].getAttribute('href')).toBe('mailto:admin@zyvencore.com');

    const sic = screen.getByRole('link', { name: /Superintendencia de Industria y Comercio/ });
    expect(sic.getAttribute('href')).toBe('https://www.sic.gov.co/');
    expect(sic.getAttribute('rel')).toContain('noopener');
  });

  it.each([
    ['términos', LEGAL_ROUTES.terms],
    ['privacidad', LEGAL_ROUTES.privacy],
  ])('en %s, la identificación de la sociedad está completa', (_name, path) => {
    renderAt(path);
    const contacto = screen.getByRole('region', { name: /escríbenos/i });

    expect(within(contacto).getByText('902094491-8')).toBeTruthy();
    expect(within(contacto).getByText('cr 66 c No. 60-65, Bogotá, Colombia')).toBeTruthy();
    expect(
      within(contacto).getByRole('link', { name: 'https://zyexperience.com/' }),
    ).toBeTruthy();
  });

  it('el índice apunta a anclas que existen en el documento', () => {
    const { container } = renderAt(LEGAL_ROUTES.privacy);
    const doc = parseLegalDocument(privacy);

    expect(doc.sections).toHaveLength(13);
    for (const section of doc.sections) {
      // Selector por atributo: los ids ya son slug seguro y jsdom no trae CSS.escape
      expect(container.querySelector(`[id="${section.id}"]`)).toBeTruthy();
    }
  });

  it('no se pierde ningún apartado del texto oficial', () => {
    for (const markdown of [terms, privacy]) {
      const doc = parseLegalDocument(markdown);
      const headings = [...markdown.matchAll(/^##\s+\d.*$/gm)].length;
      expect(doc.sections).toHaveLength(headings);
    }
  });
});

/**
 * El troceo en bloques, frente a finales de línea de Windows.
 *
 * El documento se parte por líneas en blanco. Con `\r\n` no hay ninguna que
 * encontrar: el texto entero se pintaba como un único título y el índice
 * quedaba apuntando a anclas inexistentes. Solo se veía en Windows —el agente
 * de Linux descarga LF—, que es la peor forma de fallar: rojo en la máquina de
 * quien programa, verde en la integración.
 */
describe('finales de línea del documento legal', () => {
  const DOC = ['## 1. Primera', 'Un párrafo.', '## 2. Segunda', 'Otro párrafo.'];

  it.each([
    ['Unix (LF)', '\n\n'],
    ['Windows (CRLF)', '\r\n\r\n'],
    ['Mac clásico (CR)', '\r\r'],
  ])('con finales de %s, cada apartado es su propio título', (_nombre, salto) => {
    const { container } = render(<LegalMarkdown markdown={DOC.join(salto)} />);

    const titulos = Array.from(container.querySelectorAll('h2'));
    expect(titulos.map((h) => h.id)).toEqual(['1-primera', '2-segunda']);
    expect(titulos.map((h) => h.textContent)).toEqual(['1. Primera', '2. Segunda']);
  });

  it('los párrafos no se cuelan dentro del título que los precede', () => {
    const { container } = render(<LegalMarkdown markdown={DOC.join('\r\n\r\n')} />);

    // El síntoma de la avería era exactamente este: un solo h2 con todo dentro
    expect(container.querySelectorAll('h2')).toHaveLength(2);
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(container.querySelector('h2')?.textContent).not.toContain('párrafo');
  });
});

/**
 * Encabezados en líneas consecutivas.
 *
 * El documento abre con `# Título` y `## Subtítulo` seguidos, sin línea en
 * blanco. El troceo por línea en blanco los metía en el mismo bloque y `Block`
 * los pintaba como un único `<h1>` con el `##` del subtítulo leído literal.
 * Las páginas nunca lo sufrieron porque `parseLegalDocument` les entrega el
 * cuerpo desde el primer apartado numerado y ese bloque se queda fuera; el
 * modal muestra el documento entero —es el texto cuyo checksum se firma— y
 * ahí sí se veía.
 */
describe('encabezados pegados sin línea en blanco', () => {
  /** Lo que sirve `GET /api/v1/public/legal/terms`: los dos documentos juntos. */
  const COMBINADO = `${terms}\n\n---\n\n${privacy}`;

  it('un título y su subtítulo en líneas seguidas son dos encabezados', () => {
    render(<LegalMarkdown markdown={'# Título\n## Subtítulo\n\nUn párrafo.'} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Título');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Subtítulo');
  });

  it('no queda ni una almohadilla de markdown a la vista', () => {
    const { container } = render(<LegalMarkdown markdown={COMBINADO} compact />);

    expect(container.textContent).not.toContain('##');
    expect(screen.getAllByRole('heading', { level: 1 })[0].textContent).toBe(
      'TÉRMINOS Y CONDICIONES DE SERVICIO',
    );
  });

  it('los dos documentos concatenados traen cada uno su título y su subtítulo', () => {
    render(<LegalMarkdown markdown={COMBINADO} compact />);

    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      'TÉRMINOS Y CONDICIONES DE SERVICIO',
      'POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES Y PRIVACIDAD',
    ]);
    expect(
      screen.getAllByRole('heading', { level: 2, name: 'Eternal Dedications — ZyvenCore S.A.S.' }),
    ).toHaveLength(2);
  });

  it('también con finales de línea de Windows', () => {
    render(<LegalMarkdown markdown={'# Título\r\n## Subtítulo\r\n\r\nUn párrafo.'} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Título');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Subtítulo');
    expect(screen.getByText('Un párrafo.')).toBeTruthy();
  });

  it('el modal de Términos muestra el título limpio y deja cerrar', async () => {
    const user = setupUser();
    const onClose = vi.fn();
    render(
      <TermsModal
        terms={{ version: '1.1', checksum: 'sha', content: COMBINADO }}
        onClose={onClose}
      />,
    );

    expect(screen.getAllByRole('heading', { level: 1 })[0].textContent).toBe(
      'TÉRMINOS Y CONDICIONES DE SERVICIO',
    );

    await user.click(screen.getByRole('button', { name: 'Entendido, volver' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
