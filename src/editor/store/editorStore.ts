import { useStore } from "zustand";
import { devtools } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { createId } from "../../lib/createId";
import {
  DEFAULT_CANVAS_SIZE,
  MAX_GRADIENT_STOPS,
  createImageElement,
  createInitialBrushState,
  createInitialGradient,
  createTextElement,
} from "../model/factories";
import {
  isEditorElement,
  type Background,
  type BrushState,
  type BrushType,
  type EditorElement,
  type GradientState,
  type ImageElement,
  type LogEntry,
  type Mode,
  type Rgba,
  type Size,
  type Status,
  type StrokeEntry,
  type TextElement,
} from "../model/types";

export interface EditorState {
  mode: Mode;
  status: Status;
  canvasSize: Size;
  background: Background;
  /** Contenido del documento: trazos y elementos (texto, imágenes) en orden. */
  log: LogEntry[];
  /**
   * Historial: versiones anteriores (`past`) y deshechas (`future`) del log.
   * El log es inmutable, así que cada versión solo guarda referencias: no
   * copia los trazos.
   */
  past: LogEntry[][];
  future: LogEntry[][];
  selectedElementId: string | null;
  brush: BrushState;
  gradient: GradientState;
}

/** Campos editables de un elemento (el id y el tipo no cambian). */
export type ElementPatch =
  | Partial<Omit<TextElement, "id" | "whatTask">>
  | Partial<Omit<ImageElement, "id" | "whatTask">>;

export interface EditorActions {
  setMode: (mode: Mode) => void;
  setStatus: (status: Status) => void;
  /** Abre una imagen nueva: cambia el tamaño del lienzo y empieza de cero. */
  loadBackground: (payload: Background & { size: Size }) => void;
  /** Cambia la imagen de fondo conservando el dibujo (p. ej. un gradiente). */
  setBackgroundImage: (payload: Background) => void;

  addStroke: (stroke: StrokeEntry) => void;
  undo: () => void;
  redo: () => void;
  /** Borra todo el dibujo. Se puede deshacer. */
  clearLog: () => void;

  addText: () => string;
  addImage: (imageUrl: string) => string;
  updateElement: (id: string, patch: ElementPatch) => void;
  /** Selecciona un elemento y lo trae al frente (null deselecciona). */
  selectElement: (id: string | null) => void;

  setBrushType: (type: BrushType) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: Rgba) => void;

  addGradientStop: () => void;
  removeGradientStop: (id: string) => void;
  setGradientStopOffset: (id: string, offset: number) => void;
  setGradientStopColor: (id: string, color: Rgba) => void;
  setGradientAngle: (angle: number) => void;
}

export type EditorStore = EditorState & EditorActions;

/** zIndex inicial de los elementos (por encima del lienzo en modo texto). */
const BASE_Z_INDEX = 15;

/** Pasos que se pueden deshacer. */
export const MAX_HISTORY = 100;

const getMaxZIndex = (log: LogEntry[]) =>
  log
    .filter(isEditorElement)
    .reduce((max, element) => Math.max(max, element.zIndex), BASE_Z_INDEX - 1);

/**
 * Nueva versión del log que se puede deshacer: guarda la actual en `past` y
 * vacía `future` (después de un cambio nuevo ya no se puede rehacer).
 */
const commit = (
  { log, past }: Pick<EditorState, "log" | "past">,
  nextLog: LogEntry[]
) => ({
  log: nextLog,
  past: [...past, log].slice(-MAX_HISTORY),
  future: [],
});

/**
 * Versión del historial que se restaura con los elementos en su estado
 * ACTUAL. Mover un texto o escribir en él no crea un paso del historial: sin
 * esto, deshacer un trazo devolvería también el texto a como estaba antes.
 */
const withCurrentElements = (snapshot: LogEntry[], current: LogEntry[]) => {
  const currentElements = new Map<string, EditorElement>();
  for (const entry of current) {
    if (isEditorElement(entry)) currentElements.set(entry.id, entry);
  }
  return snapshot.map((entry) =>
    isEditorElement(entry) ? (currentElements.get(entry.id) ?? entry) : entry
  );
};

/** Mantiene la selección solo si el elemento sigue existiendo. */
const keepSelection = (log: LogEntry[], selectedElementId: string | null) =>
  log.some((entry) => isEditorElement(entry) && entry.id === selectedElementId)
    ? selectedElementId
    : null;

export const createInitialState = (): EditorState => ({
  mode: "home",
  status: "idle",
  canvasSize: { ...DEFAULT_CANVAS_SIZE },
  background: { source: null, preview: null, mimeType: null },
  log: [],
  past: [],
  future: [],
  selectedElementId: null,
  brush: createInitialBrushState(),
  gradient: createInitialGradient(),
});

/**
 * Crea un store independiente. La app usa uno solo (`editorStore`); los tests
 * crean uno nuevo por caso para empezar siempre desde el estado inicial.
 */
export const createEditorStore = (initialState?: Partial<EditorState>) =>
  createStore<EditorStore>()(
    devtools(
      (set, get) => {
        const updateBrush = (
          name: string,
          patch: Partial<BrushState["settings"][BrushType]>
        ) =>
          set(
            ({ brush }) => ({
              brush: {
                ...brush,
                settings: {
                  ...brush.settings,
                  [brush.type]: { ...brush.settings[brush.type], ...patch },
                },
              },
            }),
            false,
            name
          );

        const updateGradientStop = (
          name: string,
          id: string,
          patch: Partial<GradientState["stops"][number]>
        ) =>
          set(
            ({ gradient }) => ({
              gradient: {
                ...gradient,
                stops: gradient.stops.map((stop) =>
                  stop.id === id ? { ...stop, ...patch } : stop
                ),
              },
            }),
            false,
            name
          );

        return {
          ...createInitialState(),
          ...initialState,

          setMode: (mode) => set({ mode }, false, "setMode"),
          setStatus: (status) => set({ status }, false, "setStatus"),

          loadBackground: ({ size, ...background }) =>
            set(
              {
                background,
                canvasSize: size,
                log: [],
                past: [],
                future: [],
                selectedElementId: null,
              },
              false,
              "loadBackground"
            ),

          setBackgroundImage: (background) =>
            set({ background }, false, "setBackgroundImage"),

          addStroke: (stroke) =>
            set(
              (state) => commit(state, [...state.log, stroke]),
              false,
              "addStroke"
            ),

          undo: () =>
            set(
              ({ log, past, future, selectedElementId }) => {
                const previous = past.at(-1);
                if (!previous) return {};
                const restored = withCurrentElements(previous, log);
                return {
                  log: restored,
                  past: past.slice(0, -1),
                  future: [...future, log],
                  selectedElementId: keepSelection(restored, selectedElementId),
                };
              },
              false,
              "undo"
            ),

          redo: () =>
            set(
              ({ log, past, future, selectedElementId }) => {
                const next = future.at(-1);
                if (!next) return {};
                const restored = withCurrentElements(next, log);
                return {
                  log: restored,
                  past: [...past, log].slice(-MAX_HISTORY),
                  future: future.slice(0, -1),
                  selectedElementId: keepSelection(restored, selectedElementId),
                };
              },
              false,
              "redo"
            ),

          clearLog: () =>
            set(
              (state) =>
                state.log.length
                  ? { ...commit(state, []), selectedElementId: null }
                  : {},
              false,
              "clearLog"
            ),

          addText: () => {
            const id = createId();
            set(
              (state) => ({
                ...commit(state, [
                  ...state.log,
                  createTextElement(id, getMaxZIndex(state.log) + 1),
                ]),
                selectedElementId: id,
              }),
              false,
              "addText"
            );
            return id;
          },

          addImage: (imageUrl) => {
            const id = createId();
            set(
              (state) => ({
                ...commit(state, [
                  ...state.log,
                  createImageElement(id, getMaxZIndex(state.log) + 1, imageUrl),
                ]),
                selectedElementId: id,
              }),
              false,
              "addImage"
            );
            return id;
          },

          // Editar un elemento no crea un paso del historial (como antes); el
          // cambio se conserva al deshacer/rehacer gracias a withCurrentElements.
          updateElement: (id, patch) =>
            set(
              ({ log }) => ({
                log: log.map((entry) =>
                  isEditorElement(entry) && entry.id === id
                    ? ({ ...entry, ...patch } as LogEntry)
                    : entry
                ),
              }),
              false,
              "updateElement"
            ),

          selectElement: (id) => {
            if (id === null || id === get().selectedElementId) {
              set({ selectedElementId: id }, false, "selectElement");
              return;
            }
            set(
              ({ log }) => {
                const others = log.filter(
                  (entry) => !(isEditorElement(entry) && entry.id === id)
                );
                const zIndex = getMaxZIndex(others) + 1;
                return {
                  selectedElementId: id,
                  log: log.map((entry) =>
                    isEditorElement(entry) &&
                    entry.id === id &&
                    entry.zIndex < zIndex
                      ? { ...entry, zIndex }
                      : entry
                  ),
                };
              },
              false,
              "selectElement"
            );
          },

          setBrushType: (type) =>
            set(
              ({ brush }) => ({ brush: { ...brush, type } }),
              false,
              "setBrushType"
            ),
          setBrushSize: (size) => updateBrush("setBrushSize", { size }),
          setBrushColor: (color) => updateBrush("setBrushColor", { color }),

          addGradientStop: () =>
            set(
              ({ gradient }) => {
                if (gradient.stops.length >= MAX_GRADIENT_STOPS) return {};
                const [template] = createInitialGradient().stops;
                return {
                  gradient: {
                    ...gradient,
                    stops: [...gradient.stops, { ...template, id: createId() }],
                  },
                };
              },
              false,
              "addGradientStop"
            ),

          removeGradientStop: (id) =>
            set(
              ({ gradient }) => {
                if (gradient.stops.length <= 1) return {};
                return {
                  gradient: {
                    ...gradient,
                    stops: gradient.stops.filter((stop) => stop.id !== id),
                  },
                };
              },
              false,
              "removeGradientStop"
            ),

          setGradientStopOffset: (id, offset) =>
            updateGradientStop("setGradientStopOffset", id, { offset }),
          setGradientStopColor: (id, color) =>
            updateGradientStop("setGradientStopColor", id, { color }),
          setGradientAngle: (angle) =>
            set(
              ({ gradient }) => ({ gradient: { ...gradient, angle } }),
              false,
              "setGradientAngle"
            ),
        };
      },
      { name: "editor", enabled: import.meta.env.DEV }
    )
  );

/** Store único de la aplicación. Fuera de React: `editorStore.getState()`. */
export const editorStore = createEditorStore();

/** Hook para leer el store desde componentes con un selector. */
export const useEditorStore = <T>(selector: (state: EditorStore) => T): T =>
  useStore(editorStore, selector);
