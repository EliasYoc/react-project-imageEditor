import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { Size } from "../model/types";
import { IDENTITY_VIEW, type View } from "../engine/viewport";

/**
 * Estado de la VISTA (no del documento): tamaño del área del lienzo y cómo se
 * muestra el documento en ella.
 *
 * Va en un store aparte porque cambia muy seguido (al redimensionar y, en la
 * Fase 2b, en cada frame del zoom) y no forma parte del dibujo: no se guarda
 * en el historial ni ensucia las devtools del documento.
 */
export interface ViewState {
  stageSize: Size;
  view: View;
  setStageSize: (stageSize: Size) => void;
  setView: (view: View) => void;
}

export const viewStore = createStore<ViewState>()((set) => ({
  stageSize: { width: 0, height: 0 },
  view: IDENTITY_VIEW,
  setStageSize: (stageSize) => set({ stageSize }),
  setView: (view) => set({ view }),
}));

export const useViewStore = <T>(selector: (state: ViewState) => T): T =>
  useStore(viewStore, selector);
