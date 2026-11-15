// Añade matchers como toBeInTheDocument() a expect() de Vitest.
import "@testing-library/jest-dom/vitest";
import { mockMediaQueries } from "./test/media";

// jsdom no trae algunas APIs del navegador que usan Radix y floating-ui.
// Se simulan lo justo para que los componentes se puedan montar en los tests
// (la interacción fina se prueba además en el navegador).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

const proto = globalThis.Element?.prototype;
if (proto) {
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
}

// Por defecto, "móvil sin ratón": ninguna media query coincide. Cada test
// puede cambiarlo con mockMediaQueries.
mockMediaQueries(() => false);
