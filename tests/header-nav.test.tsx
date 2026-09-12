import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Header } from '../src/modules/promo/components/layout/Header';
import { renderAt, setupUser } from './testUtils';

/**
 * El enlace al panel desde la landing.
 *
 * Es navegación de la app, no un ancla de la página. Vive en UN solo sitio por
 * barra: en escritorio, dentro del menú del usuario (junto al resto de su
 * cuenta); en móvil, dentro del desplegable. Antes estaba además suelto en la
 * barra de escritorio, repitiendo el mismo destino a dos centímetros del otro
 * y ocupando un sitio que la barra no tenía.
 */

const renderHeader = () => renderAt(<Header />);

const panelLinks = () => screen.queryAllByRole('link', { name: /Mis dedicatorias/i });

describe('Header . enlace a "Mis dedicatorias"', () => {
  it('sin sesión la barra de escritorio no lo ofrece: el panel la pide igualmente', () => {
    renderHeader();
    expect(panelLinks()).toHaveLength(0);
  });

  it('el menú móvil lo tiene y se cierra al pulsarlo', async () => {
    const user = setupUser();
    renderHeader();

    await user.click(screen.getByRole('button', { name: /Abrir menú|Cerrar menú/ }));
    const [link] = panelLinks();
    expect(link.getAttribute('href')).toBe('/mis-dedicatorias');

    await user.click(link);
    expect(panelLinks()).toHaveLength(0);
  });
});
