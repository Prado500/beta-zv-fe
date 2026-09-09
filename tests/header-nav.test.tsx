import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Header } from '../src/modules/promo/components/layout/Header';
import { renderAt, setupUser } from './testUtils';

/**
 * El enlace al panel desde la landing. Es navegación de la app, no un ancla de
 * la página: tiene que existir en las dos barras (escritorio y móvil) y apuntar
 * a la ruta del router.
 */

const renderHeader = () => renderAt(<Header />);

const panelLinks = () => screen.queryAllByRole('link', { name: 'Mis Dedicatorias' });

describe('Header · enlace a "Mis Dedicatorias"', () => {
  it('la barra de escritorio lleva a /mis-dedicatorias', () => {
    renderHeader();
    const [link] = panelLinks();
    expect(link.getAttribute('href')).toBe('/mis-dedicatorias');
  });

  it('el menú móvil también lo tiene y se cierra al pulsarlo', async () => {
    const user = setupUser();
    renderHeader();
    expect(panelLinks()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Toggle Menu/i }));
    expect(panelLinks()).toHaveLength(2);
    expect(panelLinks()[1].getAttribute('href')).toBe('/mis-dedicatorias');

    await user.click(panelLinks()[1]);
    expect(panelLinks()).toHaveLength(1);
  });
});
