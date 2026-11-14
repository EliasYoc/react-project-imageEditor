/**
 * Modelo del documento del editor: la ÚNICA fuente de verdad del dibujo.
 *
 * Los nombres de los registros de dibujo (`whatTask`, `data`, `coordX`...) se
 * heredan del motor legacy para no tocar el redibujado actual. En la Fase 2
 * (Konva) los trazos pasan a capas raster con historial de comandos.
 */

export type Mode = "home" | "draw" | "text";
export type Status = "idle" | "loading" | "exporting";

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Size {
  width: number;
  height: number;
}

// ---------------------------------------------------------------- pinceles

export type BrushType = "normal" | "spray" | "eraser";

export interface BrushSettings {
  size: number;
  color: Rgba;
}

export interface BrushState {
  type: BrushType;
  /** Cada pincel recuerda su propio tamaño y color. */
  settings: Record<BrushType, BrushSettings>;
}

// ---------------------------------------------------------------- trazos

/** Punto del trazo en píxeles del documento. */
export interface StrokePoint {
  coordX: number;
  coordY: number;
}

export interface PaintingEntry {
  whatTask: "painting";
  data: StrokePoint[];
  color: Rgba;
  size: number;
  globalCompositeOperation: GlobalCompositeOperation;
}

export interface SprayPaintingEntry {
  whatTask: "sprayPainting";
  data: StrokePoint[];
  color: Rgba;
  size: number;
  globalCompositeOperation: GlobalCompositeOperation;
  startCircleRadius: number;
  endCircleRadius: number;
}

/** Relleno de todo el lienzo (mantener presionado; se elimina en la Fase 2). */
export interface FillCanvasEntry {
  whatTask: "paintingWholeCanvas";
  canvasColor: Rgba;
  globalCompositeOperation: GlobalCompositeOperation;
}

export type StrokeEntry = PaintingEntry | SprayPaintingEntry | FillCanvasEntry;

// ---------------------------------------------------------------- elementos

/**
 * Posición y tamaño que mide react-moveable en pantalla. Se usan al exportar
 * para colocar el elemento sobre la imagen (desaparece en la Fase 4).
 */
export interface ElementGeometry {
  translate: [number, number];
  scale: [number, number];
  left: number | null;
  top: number | null;
  realLeft: number | null;
  realTop: number | null;
  offsetLeft: number | null;
  offsetTop: number | null;
  realWidth: number | null;
  realHeight: number | null;
  initialWidth: number | null;
  initialHeight: number | null;
}

interface BaseElement extends ElementGeometry {
  id: string;
  /** Orden de apilado: el mayor queda encima. */
  zIndex: number;
}

export interface TextStyle {
  fontFamily: string;
  /** Nombre visible de la fuente en el selector. */
  fontName: string;
  fontSize: number;
  fontWeight: number;
  color: Rgba;
}

export interface TextElement extends BaseElement, TextStyle {
  whatTask: "draggableText";
  text: string;
}

export interface ImageElement extends BaseElement {
  whatTask: "draggableImage";
  imageUrl: string;
}

export type EditorElement = TextElement | ImageElement;

/** Historial ordenado: deshacer quita el último registro, sea trazo o elemento. */
export type LogEntry = StrokeEntry | EditorElement;

export const isEditorElement = (entry: LogEntry): entry is EditorElement =>
  entry.whatTask === "draggableText" || entry.whatTask === "draggableImage";

export const isTextElement = (
  entry: LogEntry | null | undefined
): entry is TextElement => entry?.whatTask === "draggableText";

// ---------------------------------------------------------------- fondo

export interface Background {
  /** Imagen a resolución completa (se usa al exportar). */
  image: HTMLImageElement | null;
  /** Versión ligera que se muestra de fondo en el lienzo. */
  previewUrl: string | null;
  /** Tipo MIME con el que se exporta (el del archivo original). */
  mimeType: string | null;
}

// ---------------------------------------------------------------- gradiente

export interface GradientStop {
  id: string;
  color: Rgba;
  /** Posición de la parada, de 0 a 100. */
  offset: number;
}

export interface GradientState {
  stops: GradientStop[];
  /** Ángulo en grados, de 0 a 360. */
  angle: number;
}
