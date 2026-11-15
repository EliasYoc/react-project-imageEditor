import { useEffect } from "react";
import { BRUSH_SIZE_RANGE } from "../../editor/model/factories";
import { ZOOM_STEP, viewStore } from "../../editor/stage/viewStore";
import { editorStore } from "../../editor/store/editorStore";
import {
  selectCurrentBrush,
  selectSelectedText,
} from "../../editor/store/selectors";
import { BOLD_WEIGHT, NORMAL_WEIGHT, isBold } from "../text/fontWeight";
import { isTypingTarget } from "../../lib/isTypingTarget";
import { getShortcutAction, type ShortcutAction } from "./getShortcutAction";

const run = (action: ShortcutAction) => {
  const editor = editorStore.getState();
  const view = viewStore.getState();
  switch (action.type) {
    case "undo":
      return editor.undo();
    case "redo":
      return editor.redo();
    case "fit":
      return view.fitToScreen();
    case "zoomIn":
      return view.zoomBy(ZOOM_STEP);
    case "zoomOut":
      return view.zoomBy(1 / ZOOM_STEP);
    case "drawBrush":
      return editor.selectDrawBrush();
    case "eraser":
      return editor.selectEraser();
    case "deleteElement": {
      const { selectedElementId, removeElement } = editor;
      return selectedElementId ? removeElement(selectedElementId) : undefined;
    }
    case "toggleBold": {
      const text = selectSelectedText(editor);
      if (!text) return;
      return editor.editElement(text.id, {
        fontWeight: isBold(text) ? NORMAL_WEIGHT : BOLD_WEIGHT,
      });
    }
    case "deselect":
      return editor.selectElement(null);
    case "brushSize": {
      const { size } = selectCurrentBrush(editor);
      const scaled = Math.round(size * action.factor);
      // Al menos 1 px de cambio: con pinceles pequeños, ×1.25 redondeado no
      // movería el tamaño.
      const next =
        scaled === size ? size + Math.sign(action.factor - 1) : scaled;
      return editor.setBrushSize(
        Math.min(BRUSH_SIZE_RANGE.max, Math.max(BRUSH_SIZE_RANGE.min, next))
      );
    }
  }
};

/**
 * Atajos de teclado del editor (ver `getShortcutAction`). No actúan mientras
 * se escribe en un texto o en un campo: ahí Ctrl + Z deshace lo escrito.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || isTypingTarget(event.target)) return;
      const action = getShortcutAction(event, editorStore.getState().mode);
      if (!action) return;
      // Evita la acción del navegador (p. ej. Ctrl + = haría zoom de la página).
      event.preventDefault();
      run(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
