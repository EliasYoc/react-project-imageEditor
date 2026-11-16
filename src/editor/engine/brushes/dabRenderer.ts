import type { BrushStroke } from "./brushStroke";
import type { Dab } from "./dabEngine";
import {
  STAMP_FIGURES,
  type DabPreset,
  type StampFigure,
  type TipShape,
} from "./presets";
import { createRandom } from "./random";
import { getTip, tipBucket } from "./tips";

/** Escala actual del contexto (1 en pantalla, mayor al exportar). */
const contextScale = (ctx: CanvasRenderingContext2D) => {
  const transform = ctx.getTransform?.();
  return transform ? Math.hypot(transform.a, transform.b) : 1;
};

/**
 * Figura de un sello del pincel de formas. En "mix" sale de la semilla del
 * sello: el trazo se repinta siempre con las mismas figuras.
 */
export const stampFigure = (
  stroke: Pick<BrushStroke, "shape">,
  dab: Pick<Dab, "seed">
): StampFigure => {
  const shape = stroke.shape ?? "circle";
  return shape === "mix"
    ? STAMP_FIGURES[dab.seed % STAMP_FIGURES.length]
    : shape;
};

const drawBitmapDabs = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  tipShape: Exclude<TipShape, { shape: "particles" }>,
  dabs: readonly Dab[],
  baseAlpha: number
) => {
  const scale = contextScale(ctx);
  let bucket = 0;
  let figure: StampFigure | null = null;
  let tip: HTMLCanvasElement | null = null;
  for (const dab of dabs) {
    const needed = tipBucket(dab.size * scale);
    // Formas: la punta depende además de la figura de este sello.
    const needsFigure =
      tipShape.shape === "stamp" ? stampFigure(stroke, dab) : null;
    if (needed !== bucket || needsFigure !== figure || !tip) {
      bucket = needed;
      figure = needsFigure;
      tip = getTip(
        tipShape.shape === "stamp"
          ? { shape: "stamp", figure: stampFigure(stroke, dab) }
          : tipShape,
        stroke.color,
        bucket
      );
    }
    const half = dab.size / 2;
    ctx.globalAlpha = baseAlpha * dab.alpha;
    if (dab.angle) {
      ctx.save();
      ctx.translate(dab.x, dab.y);
      ctx.rotate(dab.angle);
      ctx.drawImage(tip, -half, -half, dab.size, dab.size);
      ctx.restore();
    } else {
      ctx.drawImage(tip, dab.x - half, dab.y - half, dab.size, dab.size);
    }
  }
};

/** Spray: cada sello son puntos repartidos al azar dentro de su radio. */
const drawParticleDabs = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  tip: { density: number; dotSize: number },
  dabs: readonly Dab[],
  baseAlpha: number
) => {
  const { r, g, b } = stroke.color;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  for (const dab of dabs) {
    const random = createRandom(dab.seed);
    const count = Math.max(3, Math.round(tip.density * dab.size * 0.5));
    const dot = Math.max(0.4, tip.dotSize * dab.size);
    ctx.globalAlpha = baseAlpha * dab.alpha;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      // sqrt: reparto uniforme en el círculo (si no, se amontonan en el centro).
      const distance = (Math.sqrt(random()) * dab.size) / 2;
      const angle = random() * Math.PI * 2;
      const x = dab.x + Math.cos(angle) * distance;
      const y = dab.y + Math.sin(angle) * distance;
      ctx.moveTo(x + dot, y);
      ctx.arc(x, y, dot, 0, Math.PI * 2);
    }
    ctx.fill();
  }
};

/** Estampa los sellos con la punta del preset (con el modo de fusión del contexto). */
export const drawDabs = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  preset: DabPreset,
  dabs: readonly Dab[]
) => {
  if (!dabs.length) return;
  // La opacidad que ya tenga el contexto se respeta (multiplica la del sello).
  const baseAlpha = ctx.globalAlpha;
  ctx.save();
  if (preset.tip.shape === "particles") {
    drawParticleDabs(ctx, stroke, preset.tip, dabs, baseAlpha);
  } else {
    drawBitmapDabs(ctx, stroke, preset.tip, dabs, baseAlpha);
  }
  ctx.restore();
};
