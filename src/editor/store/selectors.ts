import {
  isEditorElement,
  isStroke,
  isTextElement,
  type EditorElement,
  type LogEntry,
  type StrokeEntry,
} from "../model/types";
import type { EditorStore } from "./editorStore";

/**
 * Selector que filtra el log y se memoriza por su referencia.
 *
 * Un selector que devuelve un array nuevo en cada llamada haría que el
 * componente se volviera a renderizar sin parar.
 */
const memoizeByLog = <T>(filter: (log: LogEntry[]) => T[]) => {
  let cachedLog: LogEntry[] | null = null;
  let cached: T[] = [];
  return (state: EditorStore): T[] => {
    if (state.log !== cachedLog) {
      cachedLog = state.log;
      cached = filter(state.log);
    }
    return cached;
  };
};

/** Elementos (texto e imágenes) del documento. */
export const selectElements = memoizeByLog<EditorElement>((log) =>
  log.filter(isEditorElement)
);

/** Trazos del documento, en el orden en que se pintan. */
export const selectStrokes = memoizeByLog<StrokeEntry>((log) =>
  log.filter(isStroke)
);

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

export const selectCanUndo = (state: EditorStore) => state.past.length > 0;
export const selectCanRedo = (state: EditorStore) => state.future.length > 0;
