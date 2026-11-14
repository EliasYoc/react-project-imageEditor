import { getStroke } from "perfect-freehand";
import type { BrushStroke } from "./brushStroke";
import type { InkPreset } from "./presets";

type OutlineContext = Pick<
  CanvasRenderingContext2D,
  "beginPath" | "moveTo" | "quadraticCurveTo" | "closePath" | "fill"
> & { fillStyle: CanvasRenderingContext2D["fillStyle"] };

/**
 * Contorno del trazo (polígono) calculado por perfect-freehand.
 *
 * - Con presión real se usa la del lápiz; sin ella, si el preset lo pide,
 *   se simula con la velocidad (rápido = más fino), como una pluma real.
 * - `last`: el trazo terminó (cierra bien la punta final). El trazo en curso
 *   se calcula con `last: false`.
 */
export const inkOutline = (
  stroke: BrushStroke,
  preset: InkPreset,
  last: boolean
) =>
  getStroke(
    stroke.points.map(({ x, y, pressure }) => [x, y, pressure]),
    {
      size: stroke.size,
      thinning: preset.thinning,
      smoothing: preset.smoothing,
      streamline: preset.streamline,
      simulatePressure: !stroke.hasPressure && preset.simulatePressure,
      start: { cap: true, taper: preset.taperStart * stroke.size },
      end: { cap: true, taper: preset.taperEnd * stroke.size },
      last,
    }
  );

/**
 * Rellena el contorno con curvas entre los puntos medios (el método que
 * recomienda perfect-freehand: bordes suaves sin muchos puntos).
 */
export const fillOutline = (
  ctx: OutlineContext,
  outline: readonly number[][]
) => {
  if (outline.length < 3) return;
  const [first, second] = outline;
  ctx.beginPath();
  ctx.moveTo(first[0], first[1]);
  ctx.quadraticCurveTo(
    second[0],
    second[1],
    (first[0] + second[0]) / 2,
    (first[1] + second[1]) / 2
  );
  for (let i = 1; i < outline.length; i++) {
    const current = outline[i];
    const next = outline[(i + 1) % outline.length];
    ctx.quadraticCurveTo(
      current[0],
      current[1],
      (current[0] + next[0]) / 2,
      (current[1] + next[1]) / 2
    );
  }
  ctx.closePath();
  ctx.fill();
};

/** Pinta el trazo de tinta, opaco: la opacidad se aplica al componerlo. */
export const renderInk = (
  ctx: OutlineContext,
  stroke: BrushStroke,
  preset: InkPreset,
  last: boolean
) => {
  const { r, g, b } = stroke.color;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  fillOutline(ctx, inkOutline(stroke, preset, last));
};
