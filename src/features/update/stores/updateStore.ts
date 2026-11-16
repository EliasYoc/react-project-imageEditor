import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface UpdateState {
  /**
   * Hay una versión nueva de la app lista, pero no se aplicó sola porque se
   * habría perdido algo (p. ej. un dibujo abierto): la cabecera muestra el
   * botón "Actualizar".
   */
  isReady: boolean;
}

/** Estado de las actualizaciones de la app (fuera de React: lo cambia el service worker). */
export const updateStore = createStore<UpdateState>()(() => ({
  isReady: false,
}));

export const useUpdateStore = <T>(selector: (state: UpdateState) => T) =>
  useStore(updateStore, selector);
