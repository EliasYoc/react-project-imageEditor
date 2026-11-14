import { createId } from "../../lib/createId";
import { BRUSH_PRESETS, BRUSH_PRESET_IDS } from "../engine/brushes/presets";
import { createSeed } from "../engine/brushes/random";
import type {
  BrushPresetId,
  BrushSettings,
  BrushState,
  Rgba,
  ElementGeometry,
  GradientState,
  ImageElement,
  Size,
  StrokeEntry,
  TextElement,
  TextStyle,
} from "./types";

export const DEFAULT_CANVAS_SIZE: Size = { width: 1440, height: 2560 };

export const DEFAULT_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: DEFAULT_FONT_FAMILY,
  fontName: "Normal",
  fontSize: 22,
  fontWeight: 500,
  color: { r: 0, g: 0, b: 0, a: 1 },
};

/** Límites del tamaño de texto que ofrece el slider. */
export const TEXT_SIZE_RANGE = { min: 12, max: 50 } as const;
/** Límites del tamaño de pincel que ofrece el slider. */
export const BRUSH_SIZE_RANGE = { min: 1, max: 200 } as const;

export const createInitialBrushState = (): BrushState => ({
  presetId: "pen",
  lastDrawPresetId: "pen",
  lastEraserPresetId: "eraserHard",
  color: { r: 0, g: 0, b: 0, a: 1 },
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
}: {
  brush: BrushPresetId;
  settings: BrushSettings;
  color: Rgba;
  hasPressure?: boolean;
}): StrokeEntry => ({
  whatTask: "stroke",
  id: createId(),
  brush,
  color: { ...color },
  size: settings.size,
  opacity: settings.opacity,
  seed: createSeed(),
  hasPressure,
  points: [],
});

export const MAX_GRADIENT_STOPS = 8;

export const createInitialGradient = (): GradientState => ({
  stops: [
    { id: "first-stop", color: { r: 52, g: 201, b: 100, a: 1 }, offset: 10 },
    { id: "second-stop", color: { r: 97, g: 29, b: 173, a: 1 }, offset: 70 },
  ],
  angle: 180,
});

const createEmptyGeometry = (): ElementGeometry => ({
  translate: [0, 0],
  scale: [1, 1],
  left: null,
  top: null,
  realLeft: null,
  realTop: null,
  offsetLeft: null,
  offsetTop: null,
  realWidth: null,
  realHeight: null,
  initialWidth: null,
  initialHeight: null,
  cssTransform: null,
});

export const createTextElement = (id: string, zIndex: number): TextElement => ({
  ...createEmptyGeometry(),
  ...DEFAULT_TEXT_STYLE,
  id,
  zIndex,
  whatTask: "draggableText",
  text: "",
});

export const createImageElement = (
  id: string,
  zIndex: number,
  imageUrl: string
): ImageElement => ({
  ...createEmptyGeometry(),
  id,
  zIndex,
  whatTask: "draggableImage",
  imageUrl,
});
