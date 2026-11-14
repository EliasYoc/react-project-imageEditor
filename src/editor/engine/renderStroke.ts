import { rgbaToCss } from "../model/color";
import type { Point, Rgba, StrokeEntry } from "../model/types";

/** Radio interior del spray respecto al exterior (donde la mancha es opaca). */
export const SPRAY_INNER_RADIUS_RATIO = 0.11;
/** Distancia entre manchas del spray, respecto a su tamaño. */
export const SPRAY_SPACING_RATIO = 0.15;

type PathContext = Pick<
  CanvasRenderingContext2D,
  "beginPath" | "moveTo" | "lineTo" | "quadraticCurveTo" | "stroke"
>;

/** Modo de fusión de un trazo: el borrador quita píxeles de la capa de pintura. */
export const strokeComposite = ({
  brush,
}: Pick<StrokeEntry, "brush">): GlobalCompositeOperation =>
  brush === "eraser" ? "destination-out" : "source-over";

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

/**
 * Línea suavizada con curvas cuadráticas entre los puntos medios (el mismo
 * algoritmo que `redrawLastPath` del lienzo legacy). Con un solo punto dibuja
 * un punto redondo.
 */
export const traceSmoothPath = (ctx: PathContext, points: readonly Point[]) => {
  if (!points.length) return;
  let current = points[0];
  ctx.beginPath();
  ctx.moveTo(current.x, current.y);
  ctx.lineTo(current.x, current.y);
  for (let i = 1; i < points.length; i++) {
    const middle = midpoint(current, points[i]);
    ctx.quadraticCurveTo(current.x, current.y, middle.x, middle.y);
    current = points[i];
  }
  ctx.lineTo(current.x, current.y);
  ctx.stroke();
};

// ---------------------------------------------------------------- spray

export interface SprayState {
  /** Último punto procesado (null si el trazo acaba de empezar). */
  last: Point | null;
  /** Distancia recorrida desde la última mancha. */
  travelled: number;
}

export const createSprayState = (): SprayState => ({
  last: null,
  travelled: 0,
});

export const spraySpacing = (size: number) =>
  Math.max(1, size * SPRAY_SPACING_RATIO);

/**
 * Posiciones de las manchas del spray: una cada `spacing` píxeles a lo largo
 * del recorrido. Antes había una por evento del puntero, así que la densidad
 * dependía de la velocidad y del dispositivo.
 *
 * Es incremental (recibe y devuelve el estado) para que el trazo en curso solo
 * pinte las manchas nuevas, y da exactamente las mismas posiciones que
 * procesar todos los puntos de una vez.
 */
export const sprayDabPositions = (
  points: readonly Point[],
  spacing: number,
  state: SprayState
): { dabs: Point[]; state: SprayState } => {
  const dabs: Point[] = [];
  let { last, travelled } = state;

  for (const point of points) {
    if (!last) {
      dabs.push({ x: point.x, y: point.y });
      last = point;
      travelled = 0;
      continue;
    }
    const dx = point.x - last.x;
    const dy = point.y - last.y;
    const distance = Math.hypot(dx, dy);
    let t = spacing - travelled;
    while (t <= distance) {
      const ratio = t / distance;
      dabs.push({ x: last.x + dx * ratio, y: last.y + dy * ratio });
      t += spacing;
    }
    travelled = distance - (t - spacing);
    last = point;
  }

  return { dabs, state: { last, travelled } };
};

/** Mancha del spray: opaca en el centro y transparente en el borde. */
const drawSprayDab = (
  ctx: CanvasRenderingContext2D,
  { x, y }: Point,
  size: number,
  { r, g, b, a }: Rgba
) => {
  const outerRadius = size / 2;
  const gradient = ctx.createRadialGradient(
    x,
    y,
    outerRadius,
    x,
    y,
    outerRadius * SPRAY_INNER_RADIUS_RATIO
  );
  gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},${a})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - outerRadius, y - outerRadius, size, size);
};

/** Pinta las manchas que corresponden a `points` y devuelve el estado nuevo. */
export const stampSpray = (
  ctx: CanvasRenderingContext2D,
  stroke: Pick<StrokeEntry, "size" | "color">,
  points: readonly Point[],
  state: SprayState
): SprayState => {
  const result = sprayDabPositions(points, spraySpacing(stroke.size), state);
  for (const dab of result.dabs)
    drawSprayDab(ctx, dab, stroke.size, stroke.color);
  return result.state;
};

// ---------------------------------------------------------------- trazo

/** Configura el contexto para las líneas del pincel normal y el borrador. */
export const applyLineStyle = (
  ctx: CanvasRenderingContext2D,
  stroke: Pick<StrokeEntry, "brush" | "size" | "color">
) => {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = stroke.size;
  // El borrador se pinta opaco: lo que borra lo decide el modo de fusión.
  ctx.strokeStyle =
    stroke.brush === "eraser" ? "#000" : rgbaToCss(stroke.color);
};

/**
 * Dibuja la forma del trazo con el modo de fusión que tenga el contexto.
 * El trazo en curso se dibuja así en su propio canvas (y Konva aplica el modo
 * de fusión al mostrarlo).
 */
export const renderStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: StrokeEntry
) => {
  if (stroke.brush === "spray") {
    stampSpray(ctx, stroke, stroke.points, createSprayState());
    return;
  }
  applyLineStyle(ctx, stroke);
  traceSmoothPath(ctx, stroke.points);
};

/** Pinta un trazo terminado con su modo de fusión (raster y exportación). */
export const paintStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: StrokeEntry
) => {
  ctx.save();
  ctx.globalCompositeOperation = strokeComposite(stroke);
  renderStroke(ctx, stroke);
  ctx.restore();
};
