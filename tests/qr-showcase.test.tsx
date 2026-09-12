import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QrShowcase } from '../src/modules/promo/components/sections/QrShowcase';
import { THEME_PRESETS } from '../src/modules/editor/types';

/**
 * Las postales de muestra del hero: una por estilo, con el QR real, el
 * emblema alado en el centro y las flores del tema de fondo. El carrusel
 * repite la lista para el bucle, pero esas copias no cuentan para el lector.
 */

const EXPECTED = [
  { name: 'Valentina', from: 'Santiago', themeId: 'classic' },
  { name: 'Mariana', from: 'Sebastián', themeId: 'pastelPink' },
  { name: 'Camila', from: 'Nicolás', themeId: 'starry' },
  { name: 'Isabella', from: 'Julián', themeId: 'sunset' },
  { name: 'Salomé', from: 'Andrés', themeId: 'lavender' },
  { name: 'Antonia', from: 'Tomás', themeId: 'emerald' },
  { name: 'Manuela', from: 'Emilio', themeId: 'vintage' },
  { name: 'Luciana', from: 'Samuel', themeId: 'midnight' },
];

const postcards = () => screen.getAllByRole('figure');

/** El `<image>` del centro del QR, sea cual sea el atributo que use la librería. */
const centerIcon = (figure: HTMLElement) => {
  const image = figure.querySelector('image');
  return {
    href: image?.getAttribute('href') ?? image?.getAttribute('xlink:href') ?? '',
    width: Number(image?.getAttribute('width')),
    height: Number(image?.getAttribute('height')),
  };
};

describe('QrShowcase', () => {
  it('muestra ocho postales, una por estilo, con "Para" y "De" y el nombre del estilo', () => {
    render(<QrShowcase />);

    const figures = postcards();
    expect(figures).toHaveLength(EXPECTED.length);
    EXPECTED.forEach((expected, i) => {
      const card = within(figures[i]);
      expect(card.getByText('Para')).toBeTruthy();
      expect(card.getByText(expected.name)).toBeTruthy();
      expect(card.getByText('De')).toBeTruthy();
      expect(card.getByText(expected.from)).toBeTruthy();
      expect(card.getByText(THEME_PRESETS[expected.themeId].name)).toBeTruthy();
    });
    expect(screen.getByRole('list', { name: 'Códigos QR por estilo' })).toBeTruthy();
  });

  it('cada QR lleva el emblema alado en el centro: apaisado y dibujado como SVG propio', () => {
    render(<QrShowcase />);

    postcards().forEach((figure) => {
      const icon = centerIcon(figure);
      expect(icon.href.startsWith('data:image/svg+xml')).toBe(true);
      expect(decodeURIComponent(icon.href)).toContain('viewBox="0 0 128 72"');
      expect(icon.height).toBeLessThan(icon.width);
    });
  });

  it('cada postal va adornada con cuatro flores de su tema, invisibles para el lector', () => {
    render(<QrShowcase />);

    postcards().forEach((figure) => {
      const flowers = figure.querySelectorAll<HTMLImageElement>('img[src*="flores-web"]');
      expect(flowers).toHaveLength(4);
      flowers.forEach((flower) => {
        expect(flower.getAttribute('alt')).toBe('');
        expect(flower.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });
});
