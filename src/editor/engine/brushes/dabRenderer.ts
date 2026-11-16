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

/**
 * Lo que el pintado de los sellos recuerda de una llamada a la siguiente
 * mientras se dibuja un trazo (los sellos llegan por partes).
 */
export interface DabRenderState {
  /** Neón: los últimos sellos, cuyo núcleo hay que repasar. */
  tail: Dab[];
}

export const createDabRenderState = (): DabRenderState => ({ tail: [] });

const drawBitmapDabs = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  tipShape: Exclude<TipShape, { shape: "particles" } | { shape: "glow" }>,
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

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
/** Puntas del neón: el halo se difumina del todo; el núcleo, solo el borde. */
const GLOW_HALO = { shape: "round", hardness: 0 } as const;
const GLOW_CORE = { shape: "round", hardness: 0.55 } as const;

/**
 * Cuántos sellos anteriores tienen el núcleo al alcance del halo de uno
 * nuevo (los sellos están a `spacing` × tamaño unos de otros).
 */
export const glowTailLength = (spacing: number, core: number) =>
  Math.ceil((1 + core) / (2 * spacing));

/**
 * Neón: cada sello pinta su halo (del color del trazo) y su núcleo blanco.
 *
 * El halo de un sello cae encima del núcleo de los anteriores y lo teñiría,
 * así que después de cada halo se repasa el núcleo de los últimos sellos
 * (`state.tail`). Se hace sello a sello, no por tandas: el trazo queda igual
 * se pinte de una vez (al deshacer, al exportar) o por partes (en vivo).
 */
const drawGlowDabs = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  preset: DabPreset,
  core: number,
  dabs: readonly Dab[],
  baseAlpha: number,
  state: DabRenderState
) => {
  const scale = contextScale(ctx);
  const tailLength = glowTailLength(preset.spacing, core);
  const stamp = (dab: Dab, isCore: boolean) => {
    const size = isCore ? dab.size * core : dab.size;
    const tip = getTip(
      isCore ? GLOW_CORE : GLOW_HALO,
      isCore ? WHITE : stroke.color,
      tipBucket(size * scale)
    );
    ctx.globalAlpha = isCore ? baseAlpha : baseAlpha * dab.alpha;
    ctx.drawImage(tip, dab.x - size / 2, dab.y - size / 2, size, size);
  };
  for (const dab of dabs) {
    stamp(dab, false);
    for (const previous of state.tail) stamp(previous, true);
    stamp(dab, true);
    state.tail.push(dab);
    if (state.tail.length > tailLength) state.tail.shift();
  }
};

/**
 * Estampa los sellos con la punta del preset (con el modo de fusión del
 * contexto). `state` se conserva mientras dura un trazo que llega por partes.
 */
export const drawDabs = (
  ctx: CanvasRenderingContext2D,
  stroke: BrushStroke,
  preset: DabPreset,
  dabs: readonly Dab[],
  state: DabRenderState = createDabRenderState()
) => {
  if (!dabs.length) return;
  // La opacidad que ya tenga el contexto se respeta (multiplica la del sello).
  const baseAlpha = ctx.globalAlpha;
  const { tip } = preset;
  ctx.save();
  if (tip.shape === "particles") {
    drawParticleDabs(ctx, stroke, tip, dabs, baseAlpha);
  } else if (tip.shape === "glow") {
    drawGlowDabs(ctx, stroke, preset, tip.core, dabs, baseAlpha, state);
  } else {
    drawBitmapDabs(ctx, stroke, tip, dabs, baseAlpha);
  }
  ctx.restore();
};
