/**
 * Modelo del documento del editor: la ÚNICA fuente de verdad del dibujo.
 *
 * Todo se guarda en coordenadas del DOCUMENTO (píxeles de la imagen), nunca de
 * la pantalla: así el zoom, el tamaño de la ventana o la resolución de
 * exportación no cambian el dibujo.
 */

import type { FontId } from "../elements/fonts";

export type Mode = "home" | "draw" | "text";
/**
 * Qué está haciendo la app. `exportingVideo` va aparte de `exporting` porque
 * tarda: no se tapa la pantalla, el avance se ve en el diálogo de exportar.
 */
export type Status =
  "idle" | "loading" | "loadingVideo" | "exporting" | "exportingVideo";

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
  | "calligraphy"
  | "neon"
  | "shapes"
  | "blur"
  | "eraserHard"
  | "eraserSoft";

/**
 * Figura que estampa el pincel de formas. "mix" elige una de las demás al
 * azar en cada sello.
 */
export type StampShape = "circle" | "square" | "triangle" | "star" | "mix";

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
  /** Figura del pincel de formas (los demás pinceles no la usan). */
  shape: StampShape;
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
  /** Figura estampada: solo en los trazos del pincel de formas. */
  shape?: StampShape;
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

export type TextAlign = "left" | "center" | "right";

/*
 * Las medidas de contorno, sombra y caja van en PROPORCIÓN al tamaño de
 * letra: al cambiar el tamaño o escalar el texto, el estilo se mantiene.
 */

export interface TextStroke {
  enabled: boolean;
  color: Rgba;
  /** Grosor del contorno respecto al tamaño de letra. */
  width: number;
}

export interface TextShadow {
  enabled: boolean;
  color: Rgba;
  /** Desenfoque respecto al tamaño de letra. */
  blur: number;
  /** Desplazamiento (abajo a la derecha) respecto al tamaño de letra. */
  offset: number;
}

export interface TextBackground {
  enabled: boolean;
  color: Rgba;
  /** Margen interior respecto al tamaño de letra. */
  padding: number;
  /** Radio de las esquinas respecto al tamaño de letra. */
  radius: number;
}

export interface TextStyle {
  /** Fuente (ver editor/elements/fonts.ts). */
  fontId: FontId;
  /** Tamaño de letra en píxeles del documento. */
  fontSize: number;
  fontWeight: number;
  color: Rgba;
  align: TextAlign;
  /** Interlineado (1 = líneas pegadas). */
  lineHeight: number;
  stroke: TextStroke;
  shadow: TextShadow;
  background: TextBackground;
  /**
   * Relleno con degradado (lineal o radial) en lugar del color; null = color
   * sólido. La geometría es la de CSS dentro de la caja del texto.
   */
  gradient: Gradient | null;
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

/** Un video abierto como fondo del documento. */
export interface VideoSource {
  /**
   * El `<video>` que se reproduce: el lienzo pinta su fotograma actual. No
   * está en el DOM; su estado (pausa, posición, sonido) se lee de él mismo.
   */
  element: HTMLVideoElement;
  /** El archivo original: al exportar se vuelve a leer fotograma a fotograma. */
  file: File;
  /** URL de objeto del archivo; se libera al cerrar el documento. */
  url: string;
  /** Duración en segundos. */
  duration: number;
}

/**
 * El fondo abierto desde un archivo: una foto o un video (todo null en un
 * lienzo en blanco). Un video no tiene `source` ni `preview`: va en `video`.
 */
export interface Photo {
  /** Imagen a resolución completa: es la que se usa al exportar. */
  source: HTMLImageElement | HTMLCanvasElement | null;
  /** Copia con el tamaño del documento: es la que se muestra en el lienzo. */
  preview: HTMLCanvasElement | null;
  /** Tipo MIME con el que se exporta (el del archivo original). */
  mimeType: string | null;
  /** Nombre del archivo original, sin extensión (para sugerir al exportar). */
  fileName: string | null;
  /** El video, si el fondo es un video. */
  video: VideoSource | null;
}

// ---------------------------------------------------------------- capa de color

export type GradientType = "linear" | "radial" | "conic";

/** Parada de color de un degradado. */
export interface ColorStop {
  id: string;
  color: Rgba;
  /** Posición a lo largo del degradado, de 0 a 1. */
  offset: number;
}

/** Degradado con la misma geometría que en CSS. */
export interface Gradient {
  type: GradientType;
  stops: ColorStop[];
  /**
   * Ángulo en grados, como en CSS: 0 = hacia arriba, en sentido horario
   * (lineal: dirección; cónico: dónde empieza).
   */
  angle: number;
  /** Centro del radial y del cónico, en proporción del documento (0–1). */
  center: Point;
}

export type Fill =
  { kind: "color"; color: Rgba } | { kind: "gradient"; gradient: Gradient };

export type BackdropBlend =
  "source-over" | "multiply" | "screen" | "overlay" | "soft-light" | "color";

/**
 * Capa de color o degradado. Sin foto es el fondo del lienzo; con foto va
 * encima como un filtro (con su opacidad y modo de fusión), sin reemplazarla.
 */
export interface Backdrop {
  fill: Fill | null;
  opacity: number;
  blend: BackdropBlend;
}
