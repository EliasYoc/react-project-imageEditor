import { fitView, type View } from "../engine/viewport";
import { useEditorStore } from "../store/editorStore";
import { useViewStore } from "./viewStore";

/**
 * La vista con la que se muestra el documento ahora mismo.
 *
 * El zoom solo existe en modo Dibujar: en modo Texto (y en la pantalla de
 * inicio) se muestra ajustado a pantalla, porque los textos e imágenes
 * todavía son DOM con react-moveable y no se pueden editar escalados (Fase 4).
 * El zoom guardado no se pierde: al volver a Dibujar se recupera.
 */
export const useDisplayView = (): { view: View; fit: View } => {
  const isDrawing = useEditorStore((state) => state.mode === "draw");
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const stageSize = useViewStore((state) => state.stageSize);
  const view = useViewStore((state) => state.view);
  const fit = fitView(stageSize, canvasSize);
  return { view: isDrawing ? view : fit, fit };
};
