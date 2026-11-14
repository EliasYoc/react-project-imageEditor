import type { StrokePoint } from "../../model/types";
import type { BrushStroke } from "./brushStroke";
import { createDabState, planDabs } from "./dabEngine";
import { drawDabs } from "./dabRenderer";
import { renderInk } from "./inkEngine";
import { getBrushPreset, type BrushBlend } from "./presets";

/** Modo de fusión con el que se compone el trazo (el del preset). */
export const strokeBlend = (stroke: Pick<BrushStroke, "brush">): BrushBlend =>
  getBrushPreset(stroke.brush).blend;

/**
 * Dibuja la FORMA del trazo con opacidad completa y el modo de fusión que
 * tenga el contexto: el resultado es el "búfer" del trazo. La opacidad del
 * trazo y su modo de fusión se aplican al componerlo (`paintStroke`).
 */
export const renderStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  { last = true }: { last?: boolean } = {}
) => {
  const preset = getBrushPreset(stroke.brush);
  if (preset.engine === "ink") {
    renderInk(ctx, stroke, preset, last);
    return;
  }
  const dabs = planDabs(
    stroke,
    preset,
    createDabState(stroke),
    stroke.points,
    last
  );
  drawDabs(ctx, stroke, preset, dabs);
};

/**
 * Pinta el trazo en curso en su canvas, a medida que llegan puntos.
 *
 * - Tinta: el contorno depende de todo el trazo, así que se repinta entero.
 * - Sellos: solo se estampan los sellos nuevos (el estado se conserva).
 */
export const createLiveRenderer = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke
) => {
  const preset = getBrushPreset(stroke.brush);
  const clear = () => ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (preset.engine === "ink") {
    return {
      update(allPoints: StrokePoint[]) {
        clear();
        renderInk(ctx, { ...stroke, points: allPoints }, preset, false);
      },
    };
  }

  const state = createDabState(stroke);
  return {
    update(_allPoints: StrokePoint[], newPoints: readonly StrokePoint[]) {
      drawDabs(
        ctx,
        stroke,
        preset,
        planDabs(stroke, preset, state, newPoints, false)
      );
    },
  };
};

export type LiveRenderer = ReturnType<typeof createLiveRenderer>;

/**
 * Pinta un trazo terminado sobre `target` (el raster o la imagen exportada).
 *
 * Primero dibuja la forma en `scratch` (el búfer del trazo) y después la
 * compone con la opacidad y el modo de fusión del trazo. Así un marcador
 * semitransparente no se oscurece donde se cruza consigo mismo, pero sí al
 * pasar un trazo sobre otro (como un rotulador real).
 *
 * Si la opacidad es 1 y el modo es normal o borrar, el resultado es el mismo
 * pintando directamente (la composición "encima" es asociativa) y se evita el
 * búfer.
 */
export const paintStroke = (
  target: CanvasRenderingContext2D,
  stroke: BrushStroke,
  scratch: HTMLCanvasElement | null
) => {
  const blend = strokeBlend(stroke);
  const canPaintDirectly = stroke.opacity >= 1 && blend !== "multiply";

  if (canPaintDirectly || !scratch) {
    target.save();
    target.globalCompositeOperation = blend;
    if (!canPaintDirectly) target.globalAlpha = stroke.opacity;
    renderStroke(target, stroke);
    target.restore();
    return;
  }

  const { width, height } = target.canvas;
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width;
    scratch.height = height;
  }
  const buffer = scratch.getContext("2d");
  if (!buffer) return;
  buffer.setTransform(1, 0, 0, 1, 0, 0);
  buffer.clearRect(0, 0, width, height);
  // Misma transformación que el destino (p. ej. la escala de la exportación).
  buffer.setTransform(target.getTransform());
  renderStroke(buffer, stroke);

  target.save();
  target.setTransform(1, 0, 0, 1, 0, 0);
  target.globalAlpha = stroke.opacity;
  target.globalCompositeOperation = blend;
  target.drawImage(scratch, 0, 0);
  target.restore();
};
