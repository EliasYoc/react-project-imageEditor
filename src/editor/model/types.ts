/**
 * Modelo del documento del editor: la ÚNICA fuente de verdad del dibujo.
 *
 * Todo se guarda en coordenadas del DOCUMENTO (píxeles de la imagen), nunca de
 * la pantalla: así el zoom, el tamaño de la ventana o la resolución de
 * exportación no cambian el dibujo.
 */

import type { FontId } from "../elements/fonts";

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

/** Presets de pincel (sus parámetros están en editor/engine/brushes/presets.ts). */
export type BrushPresetId =
  | "pen"
  | "marker"
  | "pencil"
  | "chalk"
  | "airbrush"
  | "spray"
  | "highlighter"
  | "eraserHard"
  | "eraserSoft";

/** Ajustes que el usuario cambia; cada preset recuerda los suyos. */
export interface BrushSettings {
  /** Diámetro en píxeles del documento. */
  size: number;
  /** Opacidad del trazo completo, de 0 a 1. */
  opacity: number;
  /** Estabilización, de 0 (nada) a 1 (máxima). */
  stabilizer: number;
}

export interface BrushState {
  presetId: BrushPresetId;
  /** Último pincel y último borrador usados (para alternar entre ambos). */
  lastDrawPresetId: BrushPresetId;
  lastEraserPresetId: BrushPresetId;
  /** Color compartido por todos los pinceles (la transparencia es la opacidad). */
  color: Rgba;
  settings: Record<BrushPresetId, BrushSettings>;
}

// ---------------------------------------------------------------- trazos

/** Punto de un trazo en píxeles del documento. */
export interface StrokePoint extends Point {
  /** Presión de 0 a 1 (el ratón no tiene presión: se guarda 0.5). */
  pressure: number;
}

/**
 * Un trazo es un VECTOR: los puntos que recorrió el puntero (ya estabilizados)
 * y el pincel con el que se hizo. El raster de la pantalla se genera a partir
 * de aquí, así que se puede volver a pintar a cualquier resolución (p. ej. al
 * exportar) y siempre igual (la variación aleatoria usa `seed`).
 */
export interface StrokeEntry {
  whatTask: "stroke";
  id: string;
  brush: BrushPresetId;
  color: Rgba;
  /** Diámetro en píxeles del documento. */
  size: number;
  /** Opacidad del trazo completo, de 0 a 1. */
  opacity: number;
  seed: number;
  /** Se hizo con un lápiz que mide la presión. */
  hasPressure: boolean;
  points: StrokePoint[];
}

// ---------------------------------------------------------------- elementos

/**
 * Posición, giro y escala de un elemento en píxeles del DOCUMENTO (como los
 * trazos): no dependen de la pantalla, el zoom ni la resolución de salida.
 */
interface BaseElement {
  id: string;
  /** Orden de apilado: el mayor queda encima. */
  zIndex: number;
  /** Esquina superior izquierda (antes de girar), en píxeles del documento. */
  x: number;
  y: number;
  /** Giro en grados. */
  rotation: number;
  /** Escala uniforme. */
  scale: number;
}

export interface TextStyle {
  /** Fuente (ver editor/elements/fonts.ts). */
  fontId: FontId;
  /** Tamaño de letra en píxeles del documento. */
  fontSize: number;
  fontWeight: number;
  color: Rgba;
}

export interface TextElement extends BaseElement, TextStyle {
  whatTask: "text";
  text: string;
  /** Ancho de ajuste en píxeles del documento; null = ancho automático. */
  width: number | null;
}

export interface ImageElement extends BaseElement {
  whatTask: "image";
  /** URL de la imagen (blob:). */
  src: string;
  /** Tamaño sin escalar, en píxeles del documento. */
  width: number;
  height: number;
}

export type EditorElement = TextElement | ImageElement;

/** Contenido del documento, en orden: trazos y elementos (texto, imágenes). */
export type LogEntry = StrokeEntry | EditorElement;

export const isStroke = (entry: LogEntry): entry is StrokeEntry =>
  entry.whatTask === "stroke";

export const isEditorElement = (entry: LogEntry): entry is EditorElement =>
  entry.whatTask === "text" || entry.whatTask === "image";

export const isTextElement = (
  entry: LogEntry | null | undefined
): entry is TextElement => entry?.whatTask === "text";

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
