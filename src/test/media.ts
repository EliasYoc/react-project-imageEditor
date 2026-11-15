/**
 * `window.matchMedia` de mentira para los tests (jsdom no lo implementa):
 * `matches(query)` decide qué media queries coinciden, p. ej. para probar la
 * versión de escritorio de un componente.
 */
export const mockMediaQueries = (matches: (query: string) => boolean) => {
  window.matchMedia = (query: string) =>
    ({
      matches: matches(query),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
};
