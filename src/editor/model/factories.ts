import { createId } from "../../lib/createId";
import { DEFAULT_FONT_ID } from "../elements/fonts";
import {
  BRUSH_PRESETS,
  BRUSH_PRESET_IDS,
  usesStampShape,
} from "../engine/brushes/presets";
import { createSeed } from "../engine/brushes/random";
import type {
  BrushPresetId,
  BrushSettings,
  BrushState,
  Backdrop,
  ImageElement,
  Point,
  Rgba,
  Size,
  StampShape,
  StrokeEntry,
  TextElement,
  TextStyle,
} from "./types";

export const DEFAULT_CANVAS_SIZE: Size = { width: 1440, height: 2560 };

/** Estilo de un texto nuevo (el tamaño depende del documento). */
export const createDefaultTextStyle = (): Omit<TextStyle, "fontSize"> => ({
  fontId: DEFAULT_FONT_ID,
  fontWeight: 500,
  color: { r: 0, g: 0, b: 0, a: 1 },
  align: "left",
  lineHeight: 1.15,
  stroke: {
    isEnabled: false,
    color: { r: 255, g: 255, b: 255, a: 1 },
    width: 0.08,
  },
  shadow: {
    isEnabled: false,
    color: { r: 0, g: 0, b: 0, a: 0.5 },
    blur: 0.1,
    offset: 0.05,
  },
  background: {
    isEnabled: false,
    color: { r: 0, g: 0, b: 0, a: 0.6 },
    padding: 0.25,
    radius: 0.2,
  },
  gradient: null,
});

export const DEFAULT_TEXT_STYLE = createDefaultTextStyle();

/** Límites del tamaño de texto que ofrece el slider (píxeles del documento). */
export const TEXT_SIZE_RANGE = { min: 8, max: 600 } as const;

/**
 * Tamaño de letra de un texto nuevo: un 8 % del lado menor del documento, así
 * se lee igual en un lienzo pequeño que en una foto de 4000 px.
 */
export const defaultFontSize = ({ width, height }: Size) =>
  Math.min(
    TEXT_SIZE_RANGE.max,
    Math.max(TEXT_SIZE_RANGE.min, Math.round(Math.min(width, height) * 0.08))
  );
/** Límites del tamaño de pincel que ofrece el slider. */
export const BRUSH_SIZE_RANGE = { min: 1, max: 200 } as const;

export const createInitialBrushState = (): BrushState => ({
  presetId: "pen",
  lastDrawPresetId: "pen",
  lastEraserPresetId: "eraserHard",
  color: { r: 0, g: 0, b: 0, a: 1 },
  shape: "circle",
  settings: Object.fromEntries(
    BRUSH_PRESET_IDS.map((id) => [id, { ...BRUSH_PRESETS[id].defaults }])
  ) as Record<BrushPresetId, BrushSettings>,
});

/** Trazo nuevo (sin puntos todavía) con una copia del pincel actual. */
export const createStroke = ({
  brush,
  settings,
  color,
  hasPressure = false,
  shape = "circle",
}: {
  brush: BrushPresetId;
  settings: BrushSettings;
  color: Rgba;
  hasPressure?: boolean;
  /** Figura elegida para el pincel de formas (los demás la ignoran). */
  shape?: StampShape;
}): StrokeEntry => ({
  whatTask: "stroke",
  id: createId(),
  brush,
  color: { ...color },
  size: settings.size,
  opacity: settings.opacity,
  seed: createSeed(),
  hasPressure,
  // Solo la guardan los trazos que la usan: cambiarla después no los altera.
  ...(usesStampShape(brush) && { shape }),
  points: [],
});

/** Sin capa de color: el lienzo en blanco o la foto tal cual. */
export const createInitialBackdrop = (): Backdrop => ({
  fill: null,
  opacity: 1,
  blend: "source-over",
});

/** Texto nuevo (vacío) con la esquina superior izquierda en `position`. */
export const createTextElement = ({
  id,
  zIndex,
  position,
  fontSize,
}: {
  id: string;
  zIndex: number;
  position: Point;
  fontSize: number;
}): TextElement => ({
  ...createDefaultTextStyle(),
  whatTask: "text",
  id,
  zIndex,
  x: position.x,
  y: position.y,
  rotation: 0,
  scale: 1,
  fontSize,
  text: "",
  width: null,
});

/** Imagen nueva centrada en `center`. */
export const createImageElement = ({
  id,
  zIndex,
  src,
  width,
  height,
  center,
}: {
  id: string;
  zIndex: number;
  src: string;
  width: number;
  height: number;
  center: Point;
}): ImageElement => ({
  whatTask: "image",
  id,
  zIndex,
  src,
  width,
  height,
  x: center.x - width / 2,
  y: center.y - height / 2,
  rotation: 0,
  scale: 1,
});
