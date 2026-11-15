import { useCallback, useSyncExternalStore } from "react";

/** Pantalla ancha: paneles laterales en lugar de hojas inferiores. */
export const DESKTOP_QUERY = "(min-width: 900px)";

/** Dispositivo con ratón o trackpad: tiene sentido mostrar tooltips. */
export const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * ¿Coincide la media query? Se actualiza al cambiar (girar el móvil,
 * redimensionar la ventana) sin estado propio: `useSyncExternalStore` lee
 * `matchMedia` directamente.
 */
export const useMediaQuery = (query: string) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
};
