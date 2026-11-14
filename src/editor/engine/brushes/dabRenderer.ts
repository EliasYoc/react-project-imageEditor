import type { BrushStroke } from "./brushStroke";
import type { Dab } from "./dabEngine";
import type { DabPreset } from "./presets";
import { createRandom } from "./random";
import { getTip, tipBucket, type BitmapTip } from "./tips";

/** Escala actual del contexto (1 en pantalla, mayor al exportar). */
const contextScale = (ctx: CanvasRenderingContext2D) => {
  const transform = ctx.getTransform?.();
  return transform ? Math.hypot(transform.a, transform.b) : 1;
};

const drawBitmapDabs = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  tipShape: BitmapTip,
  dabs: readonly Dab[],
  baseAlpha: number
) => {
  const scale = contextScale(ctx);
  let bucket = 0;
  let tip: HTMLCanvasElement | null = null;
  for (const dab of dabs) {
    const needed = tipBucket(dab.size * scale);
    if (needed !== bucket || !tip) {
      bucket = needed;
      tip = getTip(tipShape, stroke.color, bucket);
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
