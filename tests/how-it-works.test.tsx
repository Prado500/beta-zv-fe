import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '../src/modules/promo/components/sections/HowItWorks';
import { SECTION_LINKS } from '../src/modules/promo/components/layout/sectionLinks';

/**
 * "Cómo funciona tu acceso": tres pasos que en escritorio van en rejilla y en
 * móvil en una cinta que avanza sola. Lo que se afirma es lo que se lee.
 */

const STEPS = ['Asegura tu lugar', 'Construye la magia', 'Recibe y sorprende'];

const mediaList = (query: string, matches: boolean): MediaQueryList =>
  ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;

/** Pantalla ancha: solo la consulta de escritorio responde que sí. */
const onDesktop = () =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => mediaList(query, query === '(min-width: 768px)'));

afterEach(() => vi.restoreAllMocks());

describe('HowItWorks', () => {
  it('en móvil los tres pasos van en la cinta, numerados y sin repetirse para el lector', () => {
    render(<HowItWorks />);

    expect(screen.getByRole('list', { name: /paso a paso/ })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    STEPS.forEach((title, i) => {
      const heading = screen.getByRole('heading', { name: title });
      expect(heading.closest('li')?.textContent).toContain(String(i + 1));
    });
  });

  it('en escritorio son una rejilla de tres, sin cinta', () => {
    onDesktop();
    render(<HowItWorks />);

    expect(screen.queryByRole('list', { name: /paso a paso/ })).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    STEPS.forEach((title) => expect(screen.getByRole('heading', { name: title })).toBeTruthy());
  });

  it('es la sección a la que apunta "Pasos" en la barra', () => {
    render(<HowItWorks />);

    const link = SECTION_LINKS.find((item) => item.label === 'Pasos');
    expect(link).toBeTruthy();
    expect(document.getElementById(link!.href.slice(1))).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Cómo funciona\s+tu acceso/ })).toBeTruthy();
  });
});
