import type {
  BrushState,
  ElementGeometry,
  GradientState,
  ImageElement,
  Size,
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
export const BRUSH_SIZE_RANGE = { min: 15, max: 200 } as const;

export const createInitialBrushState = (): BrushState => ({
  type: "normal",
  settings: {
    normal: { size: 50, color: { r: 0, g: 0, b: 0, a: 1 } },
    spray: { size: 100, color: { r: 211, g: 13, b: 13, a: 0.45 } },
    eraser: { size: 50, color: { r: 255, g: 255, b: 255, a: 1 } },
  },
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
