import type { BrushStroke } from "../../editor/engine/brushes/brushStroke";
import { paintStroke } from "../../editor/engine/brushes/paint";
import { getBrushPreset } from "../../editor/engine/brushes/presets";
import { BRUSH_SIZE_RANGE } from "../../editor/model/factories";
import type {
  BrushPresetId,
  BrushSettings,
  Rgba,
  StampShape,
  StrokePoint,
} from "../../editor/model/types";
import { createCanvas } from "../../lib/canvas";

/** Tamaño de la vista previa en píxeles CSS. */
export const PREVIEW_SIZE = { width: 140, height: 52 };

const PADDING = 12;
/** Semilla fija: la vista previa no cambia cada vez que se abre la lista. */
const PREVIEW_SEED = 7;
/** Color de fondo sobre el que se ve lo que borra un borrador. */
const ERASER_BACKGROUND: Rgba = { r: 120, g: 120, b: 120, a: 1 };

/**
 * Grosor del trazo de muestra: el tamaño real no cabe (un aerógrafo de 120 px
 * en una tarjeta de 52), así que se reduce con la misma escala cuadrática del
 * slider. Así se conserva el orden (más grande = más grueso).
 */
export const previewStrokeSize = (size: number) => {
  const { min, max } = BRUSH_SIZE_RANGE;
  const t = Math.sqrt(Math.max(0, (size - min) / (max - min)));
  return 2 + (PREVIEW_SIZE.height * 0.42 - 2) * t;
};

/**
 * Curva en S con presión que sube y vuelve a bajar: muestra cómo responde el
 * pincel a la presión de un lápiz (puntas finas, centro grueso).
 */
export const previewPoints = (
  width = PREVIEW_SIZE.width,
  height = PREVIEW_SIZE.height
): StrokePoint[] => {
  const count = 48;
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return {
      x: PADDING + t * (width - PADDING * 2),
      y: height / 2 + Math.sin(t * Math.PI * 2) * height * 0.22,
      pressure: Math.max(0.15, Math.sin(t * Math.PI)),
    };
  });
};

export const previewStroke = (
  brush: BrushPresetId,
  settings: BrushSettings,
  color: Rgba,
  shape?: StampShape
): BrushStroke => ({
  brush,
  color,
  size: previewStrokeSize(settings.size),
  opacity: settings.opacity,
  seed: PREVIEW_SEED,
  hasPressure: true,
  shape,
  points: previewPoints(),
});

/**
 * Pinta la vista previa con el mismo motor que el lienzo. Para los borradores
 * pinta antes una franja gris: lo que borran se ve como un hueco.
 */
export const drawBrushPreview = (
  ctx: CanvasRenderingContext2D,
  brush: BrushPresetId,
  settings: BrushSettings,
  color: Rgba,
  shape?: StampShape
) => {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.restore();

  if (getBrushPreset(brush).kind === "eraser") {
    const { r, g, b } = ERASER_BACKGROUND;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(
      PADDING / 2,
      PREVIEW_SIZE.height * 0.2,
      PREVIEW_SIZE.width - PADDING,
      PREVIEW_SIZE.height * 0.6
    );
  }

  paintStroke(
    ctx,
    previewStroke(brush, settings, color, shape),
    createCanvas({ width, height })
  );
};
