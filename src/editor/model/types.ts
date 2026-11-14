/**
 * Modelo del documento del editor: la ÚNICA fuente de verdad del dibujo.
 *
 * Todo se guarda en coordenadas del DOCUMENTO (píxeles de la imagen), nunca de
 * la pantalla: así el zoom, el tamaño de la ventana o la resolución de
 * exportación no cambian el dibujo.
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

export interface Point {
  x: number;
  y: number;
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

/** Punto de un trazo en píxeles del documento. */
export interface StrokePoint extends Point {
  /** Presión de 0 a 1 (el ratón no tiene presión: se guarda 0.5). */
  pressure: number;
}

/**
 * Un trazo es un VECTOR: los puntos que recorrió el puntero y el pincel con el
 * que se hizo. El raster de la pantalla se genera a partir de aquí, así que se
 * puede volver a pintar a cualquier resolución (p. ej. al exportar).
 */
export interface StrokeEntry {
  whatTask: "stroke";
  id: string;
  brush: BrushType;
  color: Rgba;
  /** Grosor en píxeles del documento. */
  size: number;
  points: StrokePoint[];
}

// ---------------------------------------------------------------- elementos

/**
 * Posición y tamaño que mide react-moveable en pantalla (desaparece en la
 * Fase 4, cuando los elementos pasen a Konva).
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
  /** Transform CSS que aplicó Moveable; se restaura si el elemento se vuelve a montar. */
  cssTransform: string | null;
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

/** Contenido del documento, en orden: trazos y elementos (texto, imágenes). */
export type LogEntry = StrokeEntry | EditorElement;

export const isStroke = (entry: LogEntry): entry is StrokeEntry =>
  entry.whatTask === "stroke";

export const isEditorElement = (entry: LogEntry): entry is EditorElement =>
  entry.whatTask === "draggableText" || entry.whatTask === "draggableImage";

export const isTextElement = (
  entry: LogEntry | null | undefined
): entry is TextElement => entry?.whatTask === "draggableText";

// ---------------------------------------------------------------- fondo

export interface Background {
  /** Imagen a resolución completa: es la que se usa al exportar. */
  source: HTMLImageElement | HTMLCanvasElement | null;
  /** Copia con el tamaño del documento: es la que se muestra en el lienzo. */
  preview: HTMLCanvasElement | null;
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
