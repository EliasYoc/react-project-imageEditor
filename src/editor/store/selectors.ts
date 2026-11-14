import {
  isEditorElement,
  isTextElement,
  type EditorElement,
  type LogEntry,
} from "../model/types";
import type { EditorStore } from "./editorStore";

let cachedLog: LogEntry[] | null = null;
let cachedElements: EditorElement[] = [];

/**
 * Elementos (texto e imágenes) del historial.
 *
 * Se memoriza por referencia del log: un selector que devuelve un array nuevo
 * en cada llamada haría que el componente se volviera a renderizar sin parar.
 */
export const selectElements = (state: EditorStore): EditorElement[] => {
  if (state.log !== cachedLog) {
    cachedLog = state.log;
    cachedElements = state.log.filter(isEditorElement);
  }
  return cachedElements;
};

export const selectSelectedElement = (
  state: EditorStore
): EditorElement | null =>
  selectElements(state).find(
    (element) => element.id === state.selectedElementId
  ) ?? null;

/** El texto seleccionado, o null si no hay selección o es una imagen. */
export const selectSelectedText = (state: EditorStore) => {
  const element = selectSelectedElement(state);
  return isTextElement(element) ? element : null;
};

export const selectCurrentBrush = (state: EditorStore) =>
  state.brush.settings[state.brush.type];

export const selectIsEditorOpen = (state: EditorStore) => state.mode !== "home";
