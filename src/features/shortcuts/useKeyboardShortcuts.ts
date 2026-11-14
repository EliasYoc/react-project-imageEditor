import { useEffect } from "react";
import { ZOOM_STEP, viewStore } from "../../editor/stage/viewStore";
import { editorStore } from "../../editor/store/editorStore";
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
    case "brush":
      return editor.setBrushType(action.brush);
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
