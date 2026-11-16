import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

/** Qué diálogo global está abierto. */
export type GlobalDialog = "export" | "shortcuts" | null;

interface UiState {
  dialog: GlobalDialog;
  openDialog: (dialog: Exclude<GlobalDialog, null>) => void;
  closeDialog: () => void;
  /** La cabecera y la barra inferior están ocultas (más sitio para el lienzo). */
  areBarsHidden: boolean;
  toggleBars: () => void;
}

/**
 * Estado de la interfaz que no es parte del documento: los diálogos que se
 * abren desde varios sitios (un botón y un atajo de teclado) y si las barras
 * están ocultas. Va aparte del store del editor para no mezclarlo con el
 * documento ni con su historial.
 */
export const uiStore = createStore<UiState>()((set) => ({
  dialog: null,
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
  areBarsHidden: false,
  toggleBars: () =>
    set(({ areBarsHidden }) => ({ areBarsHidden: !areBarsHidden })),
}));

export const useUiStore = <T>(selector: (state: UiState) => T) =>
  useStore(uiStore, selector);
