import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { getCookie } from '../src/utils/cookies';
import { setupUser } from './testUtils';

/**
 * Píxel de Meta: formato de los eventos y lectura de cookies.
 *
 * Lo que se fija aquí no es cosmético. Un `value` que viaje como cadena, una
 * moneda en minúsculas o un `eventID` que no coincida con el del servidor no
 * dan ningún error visible: los eventos siguen llegando y el panel de anuncios
 * enseña números que no son. Por eso el formato se prueba, no se confía.
 *
 * El módulo se importa dentro de cada caso: lee el identificador del píxel al
 * cargarse, y guarda estado (lo ya enviado) que debe nacer limpio.
 */

const PIXEL_ID = '1234567890123456';

/**
 * Acepta las cookies escribiendo directamente el almacenamiento.
 *
 * No se llama a `writeConsent`: cada caso recarga los módulos, así que el
 * `utils/consent` de este archivo y el que ve `utils/pixel` son instancias
 * distintas. Lo que sí comparten es `localStorage`, que es donde vive de verdad
 * la decisión. `setup.ts` lo limpia entre casos, así que nadie hereda un "sí".
 */
const aceptarCookies = () => window.localStorage.setItem('cookieConsent', 'granted');

/** El módulo recién cargado, con el identificador puesto y un `fbq` de mentira. */
const loadPixel = async () => {
  aceptarCookies();
  vi.resetModules();
  vi.stubEnv('VITE_META_PIXEL_ID', PIXEL_ID);
  const fbq = vi.fn();
  Object.defineProperty(window, 'fbq', { writable: true, configurable: true, value: fbq });
  return { fbq, pixel: await import('../src/utils/pixel') };
};

/** Lo que se le pasó a `fbq` en la llamada número `n`, ya desmenuzado. */
const call = (fbq: ReturnType<typeof vi.fn>, index = 0) => {
  const [verb, event, payload, options] = fbq.mock.calls[index] as [
    string,
    string,
    Record<string, unknown>,
    { eventID: string } | undefined,
  ];
  return { verb, event, payload, options };
};

const purchase = {
  amountCents: 3000000,
  currency: 'COP',
  externalReference: 'ref-abc-123',
};

afterEach(() => {
  vi.unstubAllEnvs();
  delete (window as { fbq?: unknown }).fbq;
});

describe('getCookie', () => {
  beforeEach(() => {
    // jsdom acumula: cada caso escribe las suyas y caduca las del anterior.
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0]?.trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });

  it('lee las dos cookies que el backend necesita', () => {
    document.cookie = '_fbp=fb.1.1700000000000.987654321';
    document.cookie = '_fbc=fb.1.1700000000000.IwAR0abc';

    expect(getCookie('_fbp')).toBe('fb.1.1700000000000.987654321');
    expect(getCookie('_fbc')).toBe('fb.1.1700000000000.IwAR0abc');
  });

  it('devuelve vacío cuando no está, que es lo normal en `_fbc`', () => {
    document.cookie = '_fbp=fb.1.1700000000000.987654321';

    // Sin `fbclid` en la URL no hay `_fbc`. Se manda vacío, no se inventa.
    expect(getCookie('_fbc')).toBe('');
  });

  it('no confunde una cookie con otra que la lleva de prefijo', () => {
    /*
     * El caso que rompe un `indexOf('_fbc=')`: aquí `_fbc` no existe, y leerlo
     * como si existiera mandaría al backend el valor de otra cookie.
     */
    document.cookie = '_fbcx=no-soy-yo';

    expect(getCookie('_fbc')).toBe('');
    expect(getCookie('_fbcx')).toBe('no-soy-yo');
  });

  it('respeta el espacio tras el punto y coma y los `=` del valor', () => {
    document.cookie = '_fbp=fb.1.1700000000000.987654321';
    document.cookie = 'otra=a=b=c';

    expect(getCookie('otra')).toBe('a=b=c');
    expect(getCookie('_fbp')).toBe('fb.1.1700000000000.987654321');
  });
});

describe('el envoltorio blindado', () => {
  it('sin `fbq` avisa por consola y sigue: el checkout no se entera', async () => {
    aceptarCookies();
    vi.resetModules();
    vi.stubEnv('VITE_META_PIXEL_ID', PIXEL_ID);
    delete (window as { fbq?: unknown }).fbq;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { trackInitiateCheckout } = await import('../src/utils/pixel');

    expect(() => trackInitiateCheckout(purchase)).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('si `fbq` estalla, se traga el fallo', async () => {
    const { pixel } = await loadPixel();
    (window.fbq as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('bloqueador de anuncios');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(() => pixel.trackPurchase(purchase)).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});

describe('ViewContent', () => {
  it('lleva el producto y se manda una sola vez', async () => {
    const { fbq, pixel } = await loadPixel();

    pixel.trackViewContent();
    pixel.trackViewContent();

    expect(fbq).toHaveBeenCalledOnce();
    const { verb, event, payload } = call(fbq);
    expect([verb, event]).toEqual(['track', 'ViewContent']);
    expect(payload).toEqual({
      content_name: 'Eternal Connection',
      content_ids: ['eternal-connection'],
      content_type: 'product',
    });
  });
});

describe('InitiateCheckout', () => {
  it('manda el importe como NÚMERO en pesos, en COP y con `eventID`', async () => {
    const { fbq, pixel } = await loadPixel();

    pixel.trackInitiateCheckout(purchase);

    const { event, payload, options } = call(fbq);
    expect(event).toBe('InitiateCheckout');
    // 3.000.000 centavos son 30.000 pesos. Y es un número, no "30000".
    expect(payload.value).toBe(30000);
    expect(typeof payload.value).toBe('number');
    expect(payload.currency).toBe('COP');
    // Sin esto Meta contaría este evento y el del servidor como dos.
    expect(options).toEqual({ eventID: 'ref-abc-123' });
  });

  it('normaliza la moneda que venga del backend', async () => {
    const { fbq, pixel } = await loadPixel();

    pixel.trackInitiateCheckout({ ...purchase, currency: 'cop' });

    expect(call(fbq).payload.currency).toBe('COP');
  });
});

describe('Purchase', () => {
  it('viaja con el mismo formato y el identificador que deduplica', async () => {
    const { fbq, pixel } = await loadPixel();

    pixel.trackPurchase({ ...purchase, amountCents: 5000000 });

    const { event, payload, options } = call(fbq);
    expect(event).toBe('Purchase');
    expect(payload.value).toBe(50000);
    expect(typeof payload.value).toBe('number');
    expect(payload.currency).toBe('COP');
    expect(options).toEqual({ eventID: 'ref-abc-123' });
  });

  it('no repite la misma venta aunque se le insista', async () => {
    const { fbq, pixel } = await loadPixel();

    pixel.trackPurchase(purchase);
    pixel.trackPurchase(purchase);
    pixel.trackPurchase({ ...purchase, externalReference: 'otra-venta' });

    expect(fbq).toHaveBeenCalledTimes(2);
    expect(call(fbq, 1).options).toEqual({ eventID: 'otra-venta' });
  });
});

describe('las cookies que se mandan al backend', () => {
  it('van las dos, y `_fbc` vacío si no hubo anuncio', async () => {
    document.cookie = '_fbp=fb.1.1700000000000.987654321';
    const { pixel } = await loadPixel();

    expect(pixel.pixelCookies()).toEqual({
      fbp: 'fb.1.1700000000000.987654321',
      fbc: '',
    });
  });
});

describe('sin identificador configurado', () => {
  it('no carga nada ni avisa de nada: es una ausencia, no una avería', async () => {
    aceptarCookies();
    vi.resetModules();
    vi.stubEnv('VITE_META_PIXEL_ID', '');
    const fbq = vi.fn();
    Object.defineProperty(window, 'fbq', { writable: true, configurable: true, value: fbq });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const pixel = await import('../src/utils/pixel');
    pixel.initPixel();
    pixel.trackPurchase(purchase);

    expect(pixel.isPixelActive()).toBe(false);
    expect(fbq).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(document.getElementById('meta-pixel')).toBeNull();
    warn.mockRestore();
  });
});

describe('las visitas', () => {
  it('cuenta una por ruta: en una sola página el navegador solo navega una vez', async () => {
    const user = setupUser();
    const { fbq } = await loadPixel();
    const { usePixelPageViews } = await import('../src/hooks/usePixelPageViews');

    const Sonda = () => {
      usePixelPageViews();
      const navigate = useNavigate();
      return createElement('button', { onClick: () => navigate('/mis-dedicatorias') }, 'ir');
    };

    render(
      createElement(MemoryRouter, { initialEntries: ['/'] }, createElement(Sonda)),
    );

    // Primero el `init`, después la visita: al revés, la visita se perdería.
    expect(fbq.mock.calls.map((args) => `${String(args[0])} ${String(args[1])}`)).toEqual([
      'init ' + PIXEL_ID,
      'track PageView',
    ]);

    await user.click(screen.getByRole('button', { name: 'ir' }));

    expect(fbq.mock.calls.filter((args) => args[1] === 'PageView')).toHaveLength(2);
  });
});

describe('la puerta del consentimiento', () => {
  /**
   * El requisito es legal, no de producto: hasta que alguien pulsa "Aceptar",
   * el píxel no puede descargar su script, poner una cookie ni mandar un
   * evento. Se comprueba con el identificador puesto, que es el caso en el que
   * todo lo demás sí estaría listo para arrancar.
   */
  const cargarSinDecidir = async () => {
    // jsdom comparte el documento entre casos: el script que dejó otro no cuenta.
    document.getElementById('meta-pixel')?.remove();
    vi.resetModules();
    vi.stubEnv('VITE_META_PIXEL_ID', PIXEL_ID);
    const fbq = vi.fn();
    Object.defineProperty(window, 'fbq', { writable: true, configurable: true, value: fbq });
    return { fbq, pixel: await import('../src/utils/pixel') };
  };

  it('sin decidir nada, el píxel no existe: ni script, ni cookies, ni eventos', async () => {
    const { fbq, pixel } = await cargarSinDecidir();

    pixel.initPixel();
    pixel.trackPageView();
    pixel.trackViewContent();
    pixel.trackPurchase(purchase);

    expect(pixel.isPixelActive()).toBe(false);
    expect(document.getElementById('meta-pixel')).toBeNull();
    expect(fbq).not.toHaveBeenCalled();
  });

  it('con un "no" expreso, sigue sin existir', async () => {
    window.localStorage.setItem('cookieConsent', 'denied');
    const { fbq, pixel } = await cargarSinDecidir();

    pixel.initPixel();
    pixel.trackPurchase(purchase);

    expect(document.getElementById('meta-pixel')).toBeNull();
    expect(fbq).not.toHaveBeenCalled();
  });

  it('al aceptar arranca, y recupera el ViewContent que no llegó a salir', async () => {
    const { fbq, pixel } = await cargarSinDecidir();
    const { writeConsent } = await import('../src/utils/consent');

    // Baja hasta el previsualizador ANTES de aceptar: no sale nada.
    pixel.trackViewContent();
    expect(fbq).not.toHaveBeenCalled();

    writeConsent('granted');
    pixel.initPixel();
    pixel.trackViewContent();

    expect(pixel.isPixelActive()).toBe(true);
    expect(call(fbq, 0).verb).toBe('init');
    expect(call(fbq, 1).event).toBe('ViewContent');
  });
});
