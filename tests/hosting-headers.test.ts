import { describe, expect, it } from 'vitest';
import rawConfig from '../public/staticwebapp.config.json?raw';

/**
 * Azure Static Web Apps responde con `Referrer-Policy: same-origin` si no se
 * le dice otra cosa. Con esa política ningún iframe de YouTube recibe
 * `Referer`, y el reproductor muestra "Error de configuración (153)" en toda
 * la landing. Esta prueba impide que la cabecera desaparezca del config sin
 * que nadie se entere.
 */
const config = JSON.parse(rawConfig) as {
  globalHeaders?: Record<string, string>;
  navigationFallback?: { rewrite?: string };
};

describe('staticwebapp.config.json', () => {
  it('manda el Referer a orígenes cruzados, como pide YouTube', () => {
    expect(config.globalHeaders?.['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('conserva el fallback del SPA para que las cartas abran al recargar', () => {
    expect(config.navigationFallback?.rewrite).toBe('/index.html');
  });
});
