import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import {
  IDENTITY_VIEW,
  clampPan,
  fitView,
  panBy,
  screenToDocument,
  zoomAt,
  zoomLimits,
  type View,
} from "../engine/viewport";
import type { Point, Size } from "../model/types";
import { editorStore } from "../store/editorStore";

/** Cuánto acercan/alejan los botones y los atajos de teclado. */
export const ZOOM_STEP = 1.25;

/**
 * Estado de la VISTA (no del documento): tamaño del área del lienzo y cómo se
 * muestra el documento en ella.
 *
 * Va en un store aparte porque cambia en cada frame del zoom y no forma parte
 * del dibujo: no se guarda en el historial ni ensucia las devtools del
 * documento.
 */
export interface ViewState {
  stageSize: Size;
  view: View;
  /**
   * La vista muestra el documento completo ("ajustar a pantalla"). Mientras
   * sea así, se vuelve a ajustar si cambia el tamaño de la ventana; si el
   * usuario hizo zoom, se respeta.
   */
  isFitted: boolean;
  setStageSize: (stageSize: Size) => void;
  fitToScreen: () => void;
  /** Zoom manteniendo fijo un punto de la pantalla (cursor, dedos). */
  zoomAt: (screen: Point, factor: number) => void;
  /** Zoom respecto al centro del área (botones y teclado). */
  zoomBy: (factor: number) => void;
  panBy: (dx: number, dy: number) => void;
  /** Vista calculada fuera (p. ej. el pellizco); se le aplican los límites. */
  setView: (view: View) => void;
}

const documentSize = () => editorStore.getState().canvasSize;

export const createViewStore = () =>
  createStore<ViewState>()((set, get) => {
    /** Aplica los límites de desplazamiento y marca la vista como libre. */
    const setFreeView = (view: View) =>
      set({
        view: clampPan(view, get().stageSize, documentSize()),
        isFitted: false,
      });

    return {
      stageSize: { width: 0, height: 0 },
      view: IDENTITY_VIEW,
      isFitted: true,

      setStageSize: (stageSize) => {
        set({ stageSize });
        if (get().isFitted) get().fitToScreen();
        else setFreeView(get().view);
      },

      fitToScreen: () =>
        set({
          view: fitView(get().stageSize, documentSize()),
          isFitted: true,
        }),

      zoomAt: (screen, factor) => {
        const { view, stageSize } = get();
        setFreeView(
          zoomAt(view, screen, factor, zoomLimits(stageSize, documentSize()))
        );
      },

      zoomBy: (factor) => {
        const { width, height } = get().stageSize;
        get().zoomAt({ x: width / 2, y: height / 2 }, factor);
      },

      panBy: (dx, dy) => setFreeView(panBy(get().view, dx, dy)),

      setView: (view) => setFreeView(view),
    };
  });

export const viewStore = createViewStore();

/** Punto del documento que se ve en el centro del lienzo (donde aparecen los elementos nuevos). */
export const documentPointAtViewCenter = (
  state: ViewState = viewStore.getState()
) =>
  screenToDocument(
    { x: state.stageSize.width / 2, y: state.stageSize.height / 2 },
    state.view
  );

export const useViewStore = <T>(selector: (state: ViewState) => T): T =>
  useStore(viewStore, selector);
