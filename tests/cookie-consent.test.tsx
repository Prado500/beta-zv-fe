import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CookieBanner } from '../src/components/ui/CookieBanner';
import { CookieSettings } from '../src/components/ui/CookieSettings';
import {
  clearConsent,
  hasConsent,
  onConsentChange,
  readConsent,
  writeConsent,
  type Consent,
} from '../src/utils/consent';
import { setupUser } from './testUtils';

/**
 * El aviso de cookies: la puerta del píxel.
 *
 * Lo que se fija aquí es cuándo se pregunta y cuándo se deja de preguntar. Que
 * el píxel obedezca la decisión se prueba en `meta-pixel.test.tsx`; aquí solo se
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
    const oido: (Consent | null)[] = [];
    const baja = onConsentChange((value) => oido.push(value));

    writeConsent('granted');
    expect(oido).toEqual(['granted']);

    // Volver al principio también se anuncia: es lo que hace reaparecer el aviso
    clearConsent();
    expect(oido).toEqual(['granted', null]);

    // Y la baja funciona: un componente desmontado no puede seguir oyendo.
    baja();
    writeConsent('denied');
    expect(oido).toEqual(['granted', null]);
  });
});

/**
 * La vuelta atrás.
 *
 * El aviso solo se enseña mientras no se haya decidido nada, así que sin esto
 * la primera respuesta era para siempre. La Política de Privacidad publicada
 * promete, en su apartado 10, que el usuario podrá «aceptar, rechazar o
 * modificar preferencias»: esta es la parte de "modificar", y sin ella esa
 * frase sería una promesa sin implementación.
 */
describe('cambiar de idea', () => {
  const pantalla = () =>
    render(
      <>
        <CookieBanner />
        <CookieSettings />
      </>,
    );

  const aviso = () => screen.queryByRole('dialog', { name: 'Aviso de cookies' });
  const revisar = () => screen.queryByRole('button', { name: 'Preferencias de cookies' });

  it('tras aceptar, se puede volver a decidir y el aviso reaparece', async () => {
    const user = setupUser();
    writeConsent('granted');
    pantalla();

    expect(aviso()).toBeNull();
    await user.click(revisar() as HTMLElement);

    expect(aviso()).toBeTruthy();
    expect(readConsent()).toBeNull();
  });

  it('rechazar tampoco es una condena: también se revisa', async () => {
    const user = setupUser();
    writeConsent('denied');
    pantalla();

    await user.click(revisar() as HTMLElement);

    expect(aviso()).toBeTruthy();
    expect(readConsent()).toBeNull();
  });

  it('mientras no se ha decidido nada no se ofrece: el aviso ya está delante', () => {
    pantalla();

    expect(aviso()).toBeTruthy();
    expect(revisar()).toBeNull();
  });

  it('y la decisión nueva puede ser la contraria, sin recargar', async () => {
    const user = setupUser();
    writeConsent('granted');
    pantalla();

    await user.click(revisar() as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Rechazar' }));

    expect(readConsent()).toBe('denied');
    expect(aviso()).toBeNull();
    // Y vuelve a ofrecerse, porque ahora hay una decisión nueva que revisar
    expect(revisar()).toBeTruthy();
  });

  it('revocar calla el píxel en el acto', async () => {
    const user = setupUser();
    writeConsent('granted');
    pantalla();

    expect(hasConsent()).toBe(true);
    await user.click(revisar() as HTMLElement);

    /*
     * La verja de `utils/metaPixel` pregunta por esto antes de cada cosa que
     * hace, así que a partir de aquí no sale ningún evento más. El script que
     * ya se descargó sigue en la página hasta la siguiente carga: lo que se
     * corta es el envío, no lo que Meta ya recibió.
     */
    expect(hasConsent()).toBe(false);
  });
});
