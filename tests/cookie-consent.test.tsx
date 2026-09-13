import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CookieBanner } from '../src/components/ui/CookieBanner';
import { onConsentChange, readConsent, writeConsent } from '../src/utils/consent';
import { setupUser } from './testUtils';

/**
 * El aviso de cookies: la puerta del píxel.
 *
 * Lo que se fija aquí es cuándo se pregunta y cuándo se deja de preguntar. Que
 * el píxel obedezca la decisión se prueba en `pixel.test.ts`; aquí solo se
 * comprueba que la decisión se toma, se guarda y se anuncia.
 */

describe('CookieBanner', () => {
  it('pregunta mientras no se haya decidido nada', () => {
    render(<CookieBanner />);

    expect(screen.getByRole('dialog', { name: 'Aviso de cookies' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeTruthy();
  });

  it('al aceptar, guarda el sí y se quita de en medio', async () => {
    const user = setupUser();
    render(<CookieBanner />);

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(readConsent()).toBe('granted');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('al rechazar, guarda el no y tampoco vuelve a preguntar', async () => {
    const user = setupUser();
    render(<CookieBanner />);

    await user.click(screen.getByRole('button', { name: 'Rechazar' }));

    expect(readConsent()).toBe('denied');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('con la decisión ya tomada en otra visita, no aparece', () => {
    writeConsent('denied');

    render(<CookieBanner />);

    /*
     * Y esto es lo que distingue "denegado" de "todavía no preguntado": si el
     * módulo tratara los dos como lo mismo, el aviso saldría en cada visita de
     * quien ya dijo que no.
     */
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('los dos botones pesan lo mismo: rechazar cuesta lo que aceptar', () => {
    render(<CookieBanner />);

    const aceptar = screen.getByRole('button', { name: 'Aceptar' });
    const rechazar = screen.getByRole('button', { name: 'Rechazar' });

    // Misma altura y mismo ancho de caja. Un "rechazar" en letra pequeña
    // convierte el consentimiento en un trámite y deja de ser consentimiento.
    const medidas = (el: HTMLElement) =>
      [...el.classList].filter((c) => c.startsWith('h-') || c.startsWith('px-')).sort();
    expect(medidas(rechazar)).toEqual(medidas(aceptar));
    expect(medidas(aceptar).length).toBeGreaterThan(0);
  });
});

describe('la decisión guardada', () => {
  it('nace sin decidir: `null` no es `denied`', () => {
    expect(readConsent()).toBeNull();
  });

  it('un valor corrupto en el almacenamiento se trata como no preguntado', () => {
    // Lo escribe una extensión, una versión vieja o alguien a mano.
    window.localStorage.setItem('cookieConsent', 'quizás');

    expect(readConsent()).toBeNull();
  });

  it('avisa a quien escucha, que es lo que enciende el píxel sin recargar', () => {
    const oido: string[] = [];
    const baja = onConsentChange((value) => oido.push(value));

    writeConsent('granted');
    expect(oido).toEqual(['granted']);

    // Y la baja funciona: un componente desmontado no puede seguir oyendo.
    baja();
    writeConsent('denied');
    expect(oido).toEqual(['granted']);
  });
});
