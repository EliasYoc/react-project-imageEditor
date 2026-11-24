import {
  isEditorElement,
  isStroke,
  isTextElement,
  type EditorElement,
  type LogEntry,
  type StrokeEntry,
} from "../model/types";
import { splitStrokeLayers } from "../engine/brushes/layers";
import type { EditorStore } from "./editorStore";

/**
 * Selector que deriva algo del log y se memoriza por su referencia.
 *
 * Un selector que devuelve un array nuevo en cada llamada haría que el
 * componente se volviera a renderizar sin parar.
 */
const memoizeByLog = <T>(compute: (log: LogEntry[]) => T) => {
  let cachedLog: LogEntry[] | null = null;
  let cached: T | undefined;
  return (state: EditorStore): T => {
    if (state.log !== cachedLog) {
      cachedLog = state.log;
      cached = compute(state.log);
    }
    return cached as T;
  };
};

/** Elementos (texto e imágenes) del documento. */
export const selectElements = memoizeByLog<EditorElement[]>((log) =>
  log.filter(isEditorElement)
);

/** Trazos del documento, en el orden en que se pintan. */
export const selectStrokes = memoizeByLog<StrokeEntry[]>((log) =>
  log.filter(isStroke)
);

/**
 * Los trazos repartidos en sus capas: la pintura y la del resaltador, que se
 * multiplica con la foto (ver `splitStrokeLayers`).
 */
export const selectStrokeLayers = memoizeByLog((log) =>
  splitStrokeLayers(log.filter(isStroke))
);

export const selectSelectedElement = (
  state: EditorStore
): EditorElement | null =>
  selectElements(state).find(
    (element) => element.id === state.selectedElementId
  ) ?? null;

/** El texto que se está escribiendo, o null si no se edita ninguno. */
export const selectEditingText = (state: EditorStore) => {
  const element = selectElements(state).find(
    (candidate) => candidate.id === state.editingTextId
  );
  return isTextElement(element) ? element : null;
};

/** El texto seleccionado, o null si no hay selección o es una imagen. */
export const selectSelectedText = (state: EditorStore) => {
  const element = selectSelectedElement(state);
  return isTextElement(element) ? element : null;
};

/** Ajustes (tamaño, opacidad, estabilización) del preset actual. */
export const selectCurrentBrush = (state: EditorStore) =>
  state.brush.settings[state.brush.presetId];

export const selectBrushPresetId = (state: EditorStore) => state.brush.presetId;

export const selectBrushColor = (state: EditorStore) => state.brush.color;

export const selectBrushShape = (state: EditorStore) => state.brush.shape;

export const selectIsEditorOpen = (state: EditorStore) => state.mode !== "home";

export const selectCanUndo = (state: EditorStore) => state.past.length > 0;

/** El video abierto como fondo, o null (foto o lienzo en blanco). */
export const selectVideo = (state: EditorStore) => state.photo.video;

/**
 * Hay algún GIF o sticker que se mueve: un lienzo o una foto se pueden
 * exportar como video. En Safari, solo con stickers (los GIFs no se mueven).
 */
export const selectHasAnimatedElements = (state: EditorStore) =>
  selectElements(state).some(
    (element) => element.whatTask === "image" && element.animation !== "none"
  );

/** El documento tiene de fondo una foto o un video (no es un lienzo en blanco). */
export const selectHasBackground = (state: EditorStore) =>
  state.photo.source !== null || state.photo.video !== null;

/**
 * Lo que el lienzo pinta de fondo: el `<video>` (su fotograma actual) o la
 * copia de la foto; null en un lienzo en blanco.
 */
export const selectBackgroundImage = (state: EditorStore) =>
  state.photo.video?.element ?? state.photo.preview;

/**
 * El documento tiene algo que se perdería al empezar otro: dibujo, textos o
 * imágenes, una foto o un video, o una capa de color.
 */
export const selectHasDocumentContent = (state: EditorStore) =>
  state.log.length > 0 ||
  selectHasBackground(state) ||
  state.backdrop.fill !== null;
export const selectCanRedo = (state: EditorStore) => state.future.length > 0;
