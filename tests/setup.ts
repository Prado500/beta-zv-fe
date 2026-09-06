import { afterEach, beforeEach } from 'vitest';

/**
 * Lo que jsdom no trae y el código sí usa.
 *
 * No son parches para hacer pasar las pruebas: son piezas del navegador que
 * jsdom no implementa. `createObjectURL` es la más importante — el editor usa la
 * URL que devuelve como **identidad** de cada foto, así que tiene que dar un
 * valor distinto cada vez o dos fotos distintas se pisarían.
 */

let blobCounter = 0;

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: () => `blob:mock/${++blobCounter}`,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: () => undefined,
});

// `useMediaQuery` lo consulta en cuanto se monta cualquier pantalla.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

// El identificador de la compra vive en `sessionStorage`; que sobreviva de un
// caso al siguiente haría que una prueba aprobara por lo que hizo la anterior.
beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  window.sessionStorage.clear();
});
