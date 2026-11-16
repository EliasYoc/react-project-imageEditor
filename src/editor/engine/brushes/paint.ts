import { createCanvas, get2dContext } from "../../../lib/canvas";
import type { StrokePoint } from "../../model/types";
import { blurLayers, revealBlurred } from "./blur";
import type { BrushStroke } from "./brushStroke";
import { createDabState, planDabs, type Dab } from "./dabEngine";
import { createDabRenderState, drawDabs } from "./dabRenderer";
import { renderInk } from "./inkEngine";
import {
  brushEffect,
  getBrushPreset,
  type BrushBlend,
  type BrushEffect,
  type DabPreset,
} from "./presets";

/** Modo de fusión con el que se compone el trazo (el del preset). */
export const strokeBlend = (stroke: Pick<BrushStroke, "brush">): BrushBlend =>
  getBrushPreset(stroke.brush).blend;

/** Efecto que aplica el trazo en lugar de pintar (null = pinta con color). */
export const strokeEffect = (
  stroke: Pick<BrushStroke, "brush">
): BrushEffect | null => brushEffect(stroke.brush);

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

export interface LiveOptions {
  /**
   * Copia desenfocada de lo que se ve en el lienzo (`blurLayers`): el trazo
   * de desenfoque en curso la va "revelando" con sus sellos.
   */
  blurred?: HTMLCanvasElement | null;
}

/** Recuadro (en píxeles enteros, dentro de `limit`) que ocupan unos sellos. */
const dabBounds = (
  dabs: readonly Dab[],
  limit: { width: number; height: number }
) => {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const dab of dabs) {
    // Un píxel de margen por el suavizado de los bordes.
    const reach = dab.size / 2 + 1;
    left = Math.min(left, dab.x - reach);
    top = Math.min(top, dab.y - reach);
    right = Math.max(right, dab.x + reach);
    bottom = Math.max(bottom, dab.y + reach);
  }
  const x = Math.max(0, Math.floor(left));
  const y = Math.max(0, Math.floor(top));
  return {
    x,
    y,
    width: Math.min(limit.width, Math.ceil(right)) - x,
    height: Math.min(limit.height, Math.ceil(bottom)) - y,
  };
};

/**
 * Trazo de desenfoque en curso. No desenfoca nada mientras se arrastra (sería
 * caro): estampa los sellos nuevos en un canvas pequeño, cambia su color por
 * el de la copia ya desenfocada y lo pega en el canvas del trazo.
 *
 * Los sellos se acumulan igual que con un color: todos los que caen en un
 * píxel le ponen el mismo color (el de la copia), así que el resultado es la
 * copia con la opacidad acumulada de la máscara.
 */
const createBlurRevealer = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  preset: DabPreset,
  blurred: HTMLCanvasElement
) => {
  const state = createDabState(stroke);
  const batch = createCanvas({ width: 1, height: 1 });
  return {
    update(_allPoints: StrokePoint[], newPoints: readonly StrokePoint[]) {
      const dabs = planDabs(stroke, preset, state, newPoints, false);
      if (!dabs.length) return;
      const live = ctx.canvas;
      const box = dabBounds(dabs, live);
      if (box.width <= 0 || box.height <= 0) return;
      // Solo crece: cambiar el tamaño de un canvas lo vacía y cuesta.
      if (batch.width < box.width) batch.width = box.width;
      if (batch.height < box.height) batch.height = box.height;

      const buffer = get2dContext(batch);
      buffer.setTransform(1, 0, 0, 1, 0, 0);
      buffer.globalCompositeOperation = "source-over";
      buffer.clearRect(0, 0, box.width, box.height);
      buffer.translate(-box.x, -box.y);
      drawDabs(buffer, stroke, preset, dabs);

      // La misma zona de la copia (que es más pequeña que el lienzo).
      const scaleX = blurred.width / live.width;
      const scaleY = blurred.height / live.height;
      buffer.setTransform(1, 0, 0, 1, 0, 0);
      buffer.globalCompositeOperation = "source-in";
      buffer.imageSmoothingQuality = "high";
      buffer.drawImage(
        blurred,
        box.x * scaleX,
        box.y * scaleY,
        box.width * scaleX,
        box.height * scaleY,
        0,
        0,
        box.width,
        box.height
      );
      ctx.drawImage(
        batch,
        0,
        0,
        box.width,
        box.height,
        box.x,
        box.y,
        box.width,
        box.height
      );
    },
  };
};

/**
 * Pinta el trazo en curso en su canvas, a medida que llegan puntos.
 *
 * - Tinta: el contorno depende de todo el trazo, así que se repinta entero.
 * - Sellos: solo se estampan los sellos nuevos (el estado se conserva).
 * - Desenfoque: los sellos nuevos revelan la copia desenfocada (`blurred`).
 */
export const createLiveRenderer = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  { blurred }: LiveOptions = {}
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

  if (preset.effect === "blur") {
    // Sin copia no hay nada que mostrar (el trazo se guarda igual).
    return blurred
      ? createBlurRevealer(ctx, stroke, preset, blurred)
      : { update() {} };
  }

  const state = createDabState(stroke);
  const renderState = createDabRenderState();
  return {
    update(_allPoints: StrokePoint[], newPoints: readonly StrokePoint[]) {
      drawDabs(
        ctx,
        stroke,
        preset,
        planDabs(stroke, preset, state, newPoints, false),
        renderState
      );
    },
  };
};

export type LiveRenderer = ReturnType<typeof createLiveRenderer>;

/**
 * Dibuja la forma del trazo, opaca, en `scratch` (el búfer del trazo) con el
 * tamaño y la transformación de `target` (p. ej. la escala de la exportación).
 */
const renderToBuffer = (
  target: CanvasRenderingContext2D,
  stroke: BrushStroke,
  scratch: HTMLCanvasElement
) => {
  const { width, height } = target.canvas;
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width;
    scratch.height = height;
  }
  const buffer = scratch.getContext("2d");
  if (!buffer) return null;
  buffer.setTransform(1, 0, 0, 1, 0, 0);
  buffer.clearRect(0, 0, width, height);
  buffer.setTransform(target.getTransform());
  renderStroke(buffer, stroke);
  return buffer;
};

/**
 * Compone el trazo sobre `target` con su opacidad y el modo de fusión `blend`.
 *
 * Primero dibuja la forma en `scratch` (el búfer del trazo) y después la
 * compone. Así un marcador semitransparente no se oscurece donde se cruza
 * consigo mismo, pero sí al pasar un trazo sobre otro (como un rotulador
 * real).
 *
 * Si la opacidad es 1 y el modo es normal o borrar, el resultado es el mismo
 * pintando directamente (la composición "encima" es asociativa) y se evita el
 * búfer.
 */
const compositeStroke = (
  target: CanvasRenderingContext2D,
  stroke: BrushStroke,
  scratch: HTMLCanvasElement | null,
  blend: BrushBlend
) => {
  const canPaintDirectly = stroke.opacity >= 1 && blend !== "multiply";

  if (canPaintDirectly || !scratch) {
    target.save();
    target.globalCompositeOperation = blend;
    if (!canPaintDirectly) target.globalAlpha = stroke.opacity;
    renderStroke(target, stroke);
    target.restore();
    return;
  }

  if (!renderToBuffer(target, stroke, scratch)) return;
  target.save();
  target.setTransform(1, 0, 0, 1, 0, 0);
  target.globalAlpha = stroke.opacity;
  target.globalCompositeOperation = blend;
  target.drawImage(scratch, 0, 0);
  target.restore();
};

/** Copia desenfocada de la capa: se reutiliza de un trazo al siguiente. */
let layerBlur: HTMLCanvasElement | null = null;

/**
 * Trazo de desenfoque sobre una capa de trazos: desenfoca lo que ya hay
 * pintado en `target`, solo donde pasa el trazo.
 *
 * Con M = la forma del trazo (su máscara) × su opacidad:
 *
 *   capa = capa × (1 − M) + capa desenfocada × M
 *
 * que son dos pasos: quitar M de la capa ("destination-out") y sumarle la
 * copia desenfocada recortada con M ("lighter"). Sumar y no pintar encima:
 * así los bordes de la pintura se difuminan también hacia dentro.
 */
const blurInPlace = (
  target: CanvasRenderingContext2D,
  stroke: BrushStroke,
  scratch: HTMLCanvasElement | null,
  amount?: number
) => {
  // Sin búfer no se puede hacer la máscara.
  if (!scratch) return;
  // La copia se saca antes de tocar la capa.
  layerBlur = blurLayers([{ image: target.canvas }], target.canvas, {
    amount,
    into: layerBlur,
  });
  const buffer = renderToBuffer(target, stroke, scratch);
  if (!buffer) return;

  target.save();
  target.setTransform(1, 0, 0, 1, 0, 0);
  target.globalAlpha = stroke.opacity;
  target.globalCompositeOperation = "destination-out";
  target.drawImage(scratch, 0, 0);
  revealBlurred(buffer, layerBlur);
  target.globalCompositeOperation = "lighter";
  target.drawImage(scratch, 0, 0);
  target.restore();
};

export interface PaintOptions {
  /**
   * Radio del desenfoque en proporción al lado corto del destino (por
   * defecto, `BLUR_AMOUNT`). Las vistas previas usan uno mayor: son tan
   * pequeñas que el normal no se vería.
   */
  blurAmount?: number;
}

/**
 * Pinta un trazo terminado sobre `target` (el raster de una capa de trazos o
 * la imagen exportada): con color (`compositeStroke`) o, si es de
 * desenfoque, desenfocando lo que ya hay en la capa.
 */
export const paintStroke = (
  target: CanvasRenderingContext2D,
  stroke: BrushStroke,
  scratch: HTMLCanvasElement | null,
  { blurAmount }: PaintOptions = {}
) => {
  if (strokeEffect(stroke) === "blur") {
    blurInPlace(target, stroke, scratch, blurAmount);
    return;
  }
  compositeStroke(target, stroke, scratch, strokeBlend(stroke));
};

/**
 * Pinta un trazo en la MÁSCARA del desenfoque del fondo: los trazos de
 * desenfoque la rellenan (con su opacidad) y los borradores la vacían. El
 * fondo desenfocado se muestra solo donde hay máscara (`revealBlurred`).
 */
export const paintBlurMask = (
  target: CanvasRenderingContext2D,
  stroke: BrushStroke,
  scratch: HTMLCanvasElement | null
) =>
  compositeStroke(
    target,
    stroke,
    scratch,
    strokeEffect(stroke) === "blur" ? "source-over" : strokeBlend(stroke)
  );
