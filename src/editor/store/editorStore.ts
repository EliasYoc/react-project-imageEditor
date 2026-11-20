import { useStore } from "zustand";
import { devtools } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { createId } from "../../lib/createId";
import { getBrushPreset } from "../engine/brushes/presets";
import {
  DEFAULT_CANVAS_SIZE,
  createImageElement,
  createInitialBrushState,
  createInitialBackdrop,
  createTextElement,
} from "../model/factories";
import {
  isEditorElement,
  isStroke,
  isTextElement,
  type Backdrop,
  type BrushPresetId,
  type BrushState,
  type BrushSettings,
  type ImageElement,
  type LogEntry,
  type Mode,
  type Photo,
  type Point,
  type Rgba,
  type Size,
  type StampShape,
  type Status,
  type StrokeEntry,
  type TextElement,
} from "../model/types";
import { watchVideo } from "./videoLifecycle";

/** Lo que guarda cada paso del historial: el log y la capa de color. */
export interface DocumentSnapshot {
  log: LogEntry[];
  backdrop: Backdrop;
}

export interface EditorState {
  mode: Mode;
  status: Status;
  canvasSize: Size;
  /**
   * La foto o el video abiertos (no están en el historial: abrir otro
   * empieza de cero).
   */
  photo: Photo;
  /** Capa de color o degradado (fondo, o filtro sobre la foto). */
  backdrop: Backdrop;
  /** Contenido del documento: trazos y elementos (texto, imágenes) en orden. */
  log: LogEntry[];
  /**
   * Historial: versiones anteriores (`past`) y deshechas (`future`) del log.
   * El log es inmutable, así que cada versión solo guarda referencias: no
   * copia los trazos.
   */
  past: DocumentSnapshot[];
  future: DocumentSnapshot[];
  selectedElementId: string | null;
  /** Texto que se está editando con el textarea (null = ninguno). */
  editingTextId: string | null;
  /**
   * Clave del último cambio de un elemento. Un cambio con la misma clave
   * (p. ej. arrastrar el slider de tamaño) se junta con el anterior en un
   * solo paso del historial.
   */
  lastMergeKey: string | null;
  brush: BrushState;
}

/** Campos editables de un elemento (el id y el tipo no cambian). */
export type ElementPatch =
  | Partial<Omit<TextElement, "id" | "whatTask">>
  | Partial<Omit<ImageElement, "id" | "whatTask">>;

export interface EditorActions {
  setMode: (mode: Mode) => void;
  setStatus: (status: Status) => void;
  /**
   * Abre una imagen o un video nuevos: cambia el tamaño del lienzo y empieza
   * de cero.
   */
  loadPhoto: (payload: Photo & { size: Size }) => void;
  /**
   * Documento en blanco de `size`: sin foto, sin capa de color, sin dibujo
   * y sin historial. Abre el editor en modo Dibujar.
   */
  newDocument: (size: Size) => void;
  /**
   * Cambia la capa de color o degradado (un paso del historial). Con
   * `mergeKey`, los cambios seguidos con la misma clave (arrastrar una parada,
   * el dial…) se juntan en un solo paso.
   */
  setBackdrop: (backdrop: Backdrop, mergeKey?: string) => void;

  addStroke: (stroke: StrokeEntry) => void;
  undo: () => void;
  redo: () => void;
  /** Borra todo el dibujo. Se puede deshacer. */
  clearLog: () => void;
  /**
   * Borra el dibujo, vuelve la capa de color o degradado a "Ninguno" y vacía
   * el historial: NO se puede deshacer. La foto o el video se quedan.
   */
  resetDrawing: () => void;

  /** Texto nuevo (vacío) con su esquina en `position`; lo selecciona. */
  addText: (position: Point, fontSize: number) => string;
  /** Imagen nueva centrada en `center`; la selecciona. */
  addImage: (image: {
    src: string;
    width: number;
    height: number;
    center: Point;
    isAnimated: boolean;
  }) => string;
  /**
   * Cambia un elemento creando un paso del historial. Con `mergeKey`, los
   * cambios seguidos con la misma clave se juntan en un solo paso.
   */
  editElement: (id: string, patch: ElementPatch, mergeKey?: string) => void;
  /** Quita un elemento (se puede deshacer). */
  removeElement: (id: string) => void;
  /**
   * Quita un texto que se acaba de crear y se dejó vacío, sin dejar rastro en
   * el historial (como si no se hubiera creado).
   */
  discardNewText: (id: string) => void;
  /** Selecciona un elemento y lo trae al frente (null deselecciona). */
  selectElement: (id: string | null) => void;
  startTextEditing: (id: string) => void;
  stopTextEditing: () => void;

  /** Elige un preset (pincel o borrador). */
  setBrushPreset: (id: BrushPresetId) => void;
  /** Vuelve al último pincel de dibujo usado. */
  selectDrawBrush: () => void;
  /** Vuelve al último borrador usado. */
  selectEraser: () => void;
  /** Ajustes del preset actual (cada preset recuerda los suyos). */
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushStabilizer: (stabilizer: number) => void;
  /** Color compartido por todos los pinceles. */
  setBrushColor: (color: Rgba) => void;
  /** Figura que estampa el pincel de formas. */
  setBrushShape: (shape: StampShape) => void;
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
  { log, backdrop, past }: Pick<EditorState, "log" | "backdrop" | "past">,
  nextLog: LogEntry[],
  nextBackdrop: Backdrop = backdrop
) => ({
  log: nextLog,
  backdrop: nextBackdrop,
  past: [...past, { log, backdrop }].slice(-MAX_HISTORY),
  future: [],
  lastMergeKey: null,
});

const hasElement = (log: LogEntry[], id: string | null) =>
  id !== null && log.some((entry) => isEditorElement(entry) && entry.id === id);

/** Mantiene la selección y la edición solo si el elemento sigue existiendo. */
const keepElementUi = (
  log: LogEntry[],
  {
    selectedElementId,
    editingTextId,
  }: Pick<EditorState, "selectedElementId" | "editingTextId">
) => ({
  selectedElementId: hasElement(log, selectedElementId)
    ? selectedElementId
    : null,
  editingTextId: hasElement(log, editingTextId) ? editingTextId : null,
});

const patchElement = (log: LogEntry[], id: string, patch: ElementPatch) =>
  log.map((entry) =>
    isEditorElement(entry) && entry.id === id
      ? ({ ...entry, ...patch } as LogEntry)
      : entry
  );

const EMPTY_PHOTO: Photo = {
  source: null,
  preview: null,
  mimeType: null,
  fileName: null,
  video: null,
};

/**
 * Lo que se vacía al empezar un documento (foto nueva o lienzo en blanco):
 * dibujo, capa de color, selección e historial. No se puede deshacer, por eso
 * la UI pide confirmación si había algo.
 */
const createDocumentReset = () => ({
  backdrop: createInitialBackdrop(),
  log: [],
  past: [],
  future: [],
  selectedElementId: null,
  editingTextId: null,
  lastMergeKey: null,
});

export const createInitialState = (): EditorState => ({
  mode: "home",
  status: "idle",
  canvasSize: { ...DEFAULT_CANVAS_SIZE },
  photo: { ...EMPTY_PHOTO },
  backdrop: createInitialBackdrop(),
  log: [],
  past: [],
  future: [],
  selectedElementId: null,
  editingTextId: null,
  lastMergeKey: null,
  brush: createInitialBrushState(),
});

/**
 * Lo que ve Redux DevTools: el estado sin los puntos de los trazos ni las
 * versiones del historial, solo cuántos hay. La extensión serializa el estado
 * en cada cambio; con muchos trazos eso hacía lenta la app y avisaba de que el
 * estado era demasiado grande.
 */
const summarizeStateForDevtools = (state: EditorStore) => ({
  ...state,
  log: state.log.map((entry) =>
    isStroke(entry) ? { ...entry, points: entry.points.length } : entry
  ),
  past: state.past.length,
  future: state.future.length,
});

/**
 * Botones de Redux DevTools que se dejan. Se quitan los que devuelven al store
 * un estado guardado en DevTools (saltar, saltarse o reordenar acciones,
 * importar, conservar al recargar): solo tiene el resumen, sin los puntos.
 */
const DEVTOOLS_FEATURES = {
  pause: true,
  lock: true,
  export: true,
  dispatch: true,
  test: true,
};

/** El store con su estado y sus acciones (ver `createEditorStore`). */
const createStateStore = (initialState?: Partial<EditorState>) =>
  createStore<EditorStore>()(
    devtools(
      (set, get) => {
        const updateBrush = (name: string, patch: Partial<BrushSettings>) =>
          set(
            ({ brush }) => ({
              brush: {
                ...brush,
                settings: {
                  ...brush.settings,
                  [brush.presetId]: {
                    ...brush.settings[brush.presetId],
                    ...patch,
                  },
                },
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

          newDocument: (size) =>
            set(
              {
                ...createDocumentReset(),
                photo: { ...EMPTY_PHOTO },
                canvasSize: { ...size },
                mode: "draw",
              },
              false,
              "newDocument"
            ),

          loadPhoto: ({ size, ...photo }) =>
            set(
              { ...createDocumentReset(), photo, canvasSize: size },
              false,
              "loadPhoto"
            ),

          setBackdrop: (backdrop, mergeKey) =>
            set(
              (state) =>
                // Mismo ajuste que el anterior: se actualiza el último paso.
                mergeKey && mergeKey === state.lastMergeKey
                  ? { backdrop }
                  : {
                      ...commit(state, state.log, backdrop),
                      lastMergeKey: mergeKey ?? null,
                    },
              false,
              "setBackdrop"
            ),

          addStroke: (stroke) =>
            set(
              (state) => commit(state, [...state.log, stroke]),
              false,
              "addStroke"
            ),

          // Deshacer y rehacer restauran la versión EXACTA del log: todos los
          // cambios de los elementos (mover, girar, estilo…) son pasos del
          // historial.
          undo: () =>
            set(
              (state) => {
                const previous = state.past.at(-1);
                if (!previous) return {};
                return {
                  ...previous,
                  past: state.past.slice(0, -1),
                  future: [
                    ...state.future,
                    { log: state.log, backdrop: state.backdrop },
                  ],
                  lastMergeKey: null,
                  ...keepElementUi(previous.log, state),
                };
              },
              false,
              "undo"
            ),

          redo: () =>
            set(
              (state) => {
                const next = state.future.at(-1);
                if (!next) return {};
                return {
                  ...next,
                  past: [
                    ...state.past,
                    { log: state.log, backdrop: state.backdrop },
                  ].slice(-MAX_HISTORY),
                  future: state.future.slice(0, -1),
                  lastMergeKey: null,
                  ...keepElementUi(next.log, state),
                };
              },
              false,
              "redo"
            ),

          clearLog: () =>
            set(
              (state) =>
                state.log.length
                  ? {
                      ...commit(state, []),
                      selectedElementId: null,
                      editingTextId: null,
                    }
                  : {},
              false,
              "clearLog"
            ),

          resetDrawing: () =>
            set({ ...createDocumentReset() }, false, "resetDrawing"),

          addText: (position, fontSize) => {
            const id = createId();
            set(
              (state) => ({
                ...commit(state, [
                  ...state.log,
                  createTextElement({
                    id,
                    zIndex: getMaxZIndex(state.log) + 1,
                    position,
                    fontSize,
                  }),
                ]),
                selectedElementId: id,
              }),
              false,
              "addText"
            );
            return id;
          },

          addImage: ({ src, width, height, center, isAnimated }) => {
            const id = createId();
            set(
              (state) => ({
                ...commit(state, [
                  ...state.log,
                  createImageElement({
                    id,
                    zIndex: getMaxZIndex(state.log) + 1,
                    src,
                    width,
                    height,
                    center,
                    isAnimated,
                  }),
                ]),
                selectedElementId: id,
              }),
              false,
              "addImage"
            );
            return id;
          },

          editElement: (id, patch, mergeKey) =>
            set(
              (state) => {
                if (!hasElement(state.log, id)) return {};
                const log = patchElement(state.log, id, patch);
                // Mismo cambio que el anterior (p. ej. arrastrando un slider):
                // se actualiza el último paso en lugar de crear uno nuevo.
                if (mergeKey && mergeKey === state.lastMergeKey) {
                  return { log };
                }
                return {
                  ...commit(state, log),
                  lastMergeKey: mergeKey ?? null,
                };
              },
              false,
              "editElement"
            ),

          removeElement: (id) =>
            set(
              (state) => {
                if (!hasElement(state.log, id)) return {};
                const log = state.log.filter(
                  (entry) => !(isEditorElement(entry) && entry.id === id)
                );
                return { ...commit(state, log), ...keepElementUi(log, state) };
              },
              false,
              "removeElement"
            ),

          discardNewText: (id) => {
            const { log, past } = get();
            const previous = past.at(-1);
            const last = log.at(-1);
            const wasJustAdded =
              previous !== undefined &&
              previous.log.length === log.length - 1 &&
              last !== undefined &&
              isTextElement(last) &&
              last.id === id;
            if (!wasJustAdded) {
              get().removeElement(id);
              return;
            }
            // Se vuelve a la versión anterior sin pasarla a "rehacer".
            set(
              (state) => ({
                ...previous,
                past: state.past.slice(0, -1),
                lastMergeKey: null,
                ...keepElementUi(previous.log, state),
              }),
              false,
              "discardNewText"
            );
          },

          startTextEditing: (id) =>
            set(
              { editingTextId: id, selectedElementId: id },
              false,
              "startTextEditing"
            ),
          stopTextEditing: () =>
            set({ editingTextId: null }, false, "stopTextEditing"),

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

          setBrushPreset: (presetId) =>
            set(
              ({ brush }) => ({
                brush: {
                  ...brush,
                  presetId,
                  ...(getBrushPreset(presetId).kind === "eraser"
                    ? { lastEraserPresetId: presetId }
                    : { lastDrawPresetId: presetId }),
                },
              }),
              false,
              "setBrushPreset"
            ),
          selectDrawBrush: () =>
            get().setBrushPreset(get().brush.lastDrawPresetId),
          selectEraser: () =>
            get().setBrushPreset(get().brush.lastEraserPresetId),
          setBrushSize: (size) => updateBrush("setBrushSize", { size }),
          setBrushOpacity: (opacity) =>
            updateBrush("setBrushOpacity", { opacity }),
          setBrushStabilizer: (stabilizer) =>
            updateBrush("setBrushStabilizer", { stabilizer }),
          setBrushColor: (color) =>
            set(
              ({ brush }) => ({ brush: { ...brush, color } }),
              false,
              "setBrushColor"
            ),
          setBrushShape: (shape) =>
            set(
              ({ brush }) => ({ brush: { ...brush, shape } }),
              false,
              "setBrushShape"
            ),
        };
      },
      {
        name: "editor",
        enabled: import.meta.env.DEV,
        stateSanitizer: summarizeStateForDevtools,
        features: DEVTOOLS_FEATURES,
      }
    )
  );

/**
 * Crea un store independiente. La app usa uno solo (`editorStore`); los tests
 * crean uno nuevo por caso para empezar siempre desde el estado inicial.
 */
export const createEditorStore = (initialState?: Partial<EditorState>) => {
  const store = createStateStore(initialState);
  // El video del documento se suelta al cambiar de documento.
  watchVideo(store);
  return store;
};

/** Store único de la aplicación. Fuera de React: `editorStore.getState()`. */
export const editorStore = createEditorStore();

/** Hook para leer el store desde componentes con un selector. */
export const useEditorStore = <T>(selector: (state: EditorStore) => T): T =>
  useStore(editorStore, selector);
