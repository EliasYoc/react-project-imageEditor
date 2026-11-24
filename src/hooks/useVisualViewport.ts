import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  // Cambia de tamaño al abrirse o cerrarse el teclado, y se desplaza cuando
  // el navegador mueve la vista para enseñar el campo donde se escribe.
  viewport.addEventListener("resize", onChange);
  viewport.addEventListener("scroll", onChange);
  return () => {
    viewport.removeEventListener("resize", onChange);
    viewport.removeEventListener("scroll", onChange);
  };
};

// Sin `visualViewport` (navegadores muy antiguos, jsdom): se ve toda la ventana.
const readTop = () => window.visualViewport?.offsetTop ?? 0;
const readBottom = () => {
  const viewport = window.visualViewport;
  return viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
};

/**
 * Franja de la ventana que se ve de verdad, en píxeles de la ventana (los de
 * `getBoundingClientRect`): en el móvil, sin lo que tapa el teclado. El
 * teclado no encoge la página (ni `100dvh`), solo esta franja.
 */
export const useVisualViewport = () => ({
  top: useSyncExternalStore(subscribe, readTop, () => 0),
  bottom: useSyncExternalStore(subscribe, readBottom, () => Infinity),
});
