import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TermsPage from '../src/modules/legal/page/TermsPage';
import PrivacyPage from '../src/modules/legal/page/PrivacyPage';
import { LEGAL_ROUTES } from '../src/modules/legal/legalRoutes';
import { parseLegalDocument } from '../src/modules/legal/legalDocument';
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
