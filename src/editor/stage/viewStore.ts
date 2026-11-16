import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import {
  IDENTITY_VIEW,
  NO_INSETS,
  clampPan,
  fitView,
  panBy,
  screenToDocument,
  zoomAt,
  zoomLimits,
  type Insets,
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
  /**
   * Bordes del área tapados por algo opaco que flota encima (la cabecera):
   * al ajustar, el documento los deja libres.
   */
  insets: Insets;
  setStageSize: (stageSize: Size) => void;
  setInsets: (insets: Insets) => void;
  fitToScreen: () => void;
  /** Zoom manteniendo fijo un punto de la pantalla (cursor, dedos). */
  zoomAt: (screen: Point, factor: number) => void;
  /** Zoom respecto al centro de lo que se ve (botones y teclado). */
  zoomBy: (factor: number) => void;
  panBy: (dx: number, dy: number) => void;
  /** Vista calculada fuera (p. ej. el pellizco); se le aplican los límites. */
  setView: (view: View) => void;
}

const documentSize = () => editorStore.getState().canvasSize;

/** Límites de zoom de la vista: dependen del ajuste (y de lo que tapa la cabecera). */
export const selectZoomLimits = (state: ViewState) =>
  zoomLimits(state.stageSize, documentSize(), state.insets);

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
      insets: NO_INSETS,

      setStageSize: (stageSize) => {
        set({ stageSize });
        if (get().isFitted) get().fitToScreen();
        else setFreeView(get().view);
      },

      setInsets: (insets) => {
        set({ insets });
        if (get().isFitted) get().fitToScreen();
      },

      fitToScreen: () =>
        set({
          view: fitView(get().stageSize, documentSize(), get().insets),
          isFitted: true,
        }),

      zoomAt: (screen, factor) => {
        setFreeView(
          zoomAt(get().view, screen, factor, selectZoomLimits(get()))
        );
      },

      zoomBy: (factor) => {
        const { stageSize, insets } = get();
        get().zoomAt(
          {
            x: (insets.left + stageSize.width - insets.right) / 2,
            y: (insets.top + stageSize.height - insets.bottom) / 2,
          },
          factor
        );
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
