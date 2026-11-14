import type { StrokePoint } from "../../model/types";
import type { BrushStroke } from "./brushStroke";
import type { DabPreset } from "./presets";
import { pressureFactor } from "./pressure";
import { createRandom, type Random } from "./random";
import {
  createSmoothPathState,
  smoothPath,
  type SmoothPathState,
} from "./smoothPath";

/** Un sello: dónde, de qué tamaño, con qué opacidad y con qué giro. */
export interface Dab {
  x: number;
  y: number;
  /** Diámetro en píxeles del documento. */
  size: number;
  /** Opacidad del sello (flujo × presión × variación). */
  alpha: number;
  /** Giro en radianes. */
  angle: number;
  /**
   * Semilla propia del sello (las partículas la usan para sus puntos). Así el
   * orden en que se dibujan los sellos no altera la secuencia aleatoria.
   */
  seed: number;
}

export interface DabState {
  path: SmoothPathState;
  /** Último punto del recorrido procesado. */
  last: StrokePoint | null;
  /** Distancia recorrida desde el último sello. */
  travelled: number;
  /** Distancia hasta el siguiente sello (depende del tamaño del último). */
  next: number;
  random: Random;
}

/** Espaciado mínimo entre sellos, en píxeles del documento. */
const MIN_SPACING = 0.5;

export const createDabState = (
  stroke: Pick<BrushStroke, "seed">
): DabState => ({
  path: createSmoothPathState(),
  last: null,
  travelled: 0,
  next: 0,
  random: createRandom(stroke.seed),
});

const baseSize = (stroke: BrushStroke, preset: DabPreset, pressure: number) =>
  stroke.size *
  pressureFactor(pressure, preset.sizePressure, stroke.hasPressure);

const spacingAt = (stroke: BrushStroke, preset: DabPreset, pressure: number) =>
  Math.max(MIN_SPACING, preset.spacing * baseSize(stroke, preset, pressure));

/**
 * Crea el sello en un punto del recorrido aplicando presión y variación.
 * Consume SIEMPRE la misma cantidad de números aleatorios (aunque la variación
 * sea 0): así la secuencia no depende de los parámetros y el trazo es
 * reproducible.
 */
const makeDab = (
  stroke: BrushStroke,
  preset: DabPreset,
  point: StrokePoint,
  random: Random
): Dab => {
  const { jitter } = preset;
  const rSize = random();
  const rAngle = random();
  const rScatterDistance = random();
  const rScatterAngle = random();
  const rOpacity = random();
  const seed = Math.floor(random() * 2 ** 32) >>> 0;

  const size = Math.max(
    0.5,
    baseSize(stroke, preset, point.pressure) *
      (1 + jitter.size * (rSize * 2 - 1))
  );
  const scatter = jitter.scatter * size * rScatterDistance;
  const scatterAngle = rScatterAngle * Math.PI * 2;
  const alpha =
    preset.flow *
    pressureFactor(point.pressure, preset.opacityPressure, stroke.hasPressure) *
    (1 - jitter.opacity * rOpacity);

  return {
    x: point.x + Math.cos(scatterAngle) * scatter,
    y: point.y + Math.sin(scatterAngle) * scatter,
    size,
    alpha,
    angle:
      (preset.angle * Math.PI) / 180 +
      jitter.angle * Math.PI * (rAngle * 2 - 1),
    seed,
  };
};

/**
 * Sellos que corresponden a `points` (los nuevos puntos del trazo).
 *
 * Recorre el camino suavizado y pone un sello cada `spacing × tamaño`. Es
 * incremental: con el mismo estado, procesar los puntos por partes da
 * exactamente los mismos sellos que de una vez (incluida la variación
 * aleatoria, porque el generador avanza sello a sello).
 */
export const planDabs = (
  stroke: BrushStroke,
  preset: DabPreset,
  state: DabState,
  points: readonly StrokePoint[],
  isFinal: boolean
): Dab[] => {
  const dabs: Dab[] = [];
  for (const point of smoothPath(state.path, points, isFinal)) {
    const last = state.last;
    if (!last) {
      dabs.push(makeDab(stroke, preset, point, state.random));
      state.last = point;
      state.next = spacingAt(stroke, preset, point.pressure);
      state.travelled = 0;
      continue;
    }

    const dx = point.x - last.x;
    const dy = point.y - last.y;
    const distance = Math.hypot(dx, dy);
    let position = 0;
    let need = state.next - state.travelled;
    while (position + need <= distance) {
      position += need;
      const t = distance === 0 ? 0 : position / distance;
      const at: StrokePoint = {
        x: last.x + dx * t,
        y: last.y + dy * t,
        pressure: last.pressure + (point.pressure - last.pressure) * t,
      };
      dabs.push(makeDab(stroke, preset, at, state.random));
      state.next = spacingAt(stroke, preset, at.pressure);
      state.travelled = 0;
      need = state.next;
    }
    state.travelled += distance - position;
    state.last = point;
  }
  return dabs;
};
