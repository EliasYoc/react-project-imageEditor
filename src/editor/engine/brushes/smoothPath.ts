import type { StrokePoint } from "../../model/types";

/** Longitud máxima de cada tramo recto al aproximar las curvas. */
const MAX_STEP = 2;

export interface SmoothPathState {
  /** Último punto recibido (control de la siguiente curva). */
  previous: StrokePoint | null;
  /** Hasta dónde llega lo ya emitido. */
  cursor: StrokePoint | null;
}

export const createSmoothPathState = (): SmoothPathState => ({
  previous: null,
  cursor: null,
});

const midpoint = (a: StrokePoint, b: StrokePoint): StrokePoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  pressure: (a.pressure + b.pressure) / 2,
});

/** Puntos de la curva cuadrática a → b con control c (sin incluir a). */
const flattenQuadratic = (
  a: StrokePoint,
  c: StrokePoint,
  b: StrokePoint,
  out: StrokePoint[]
) => {
  const length =
    Math.hypot(c.x - a.x, c.y - a.y) + Math.hypot(b.x - c.x, b.y - c.y);
  // Con t en pasos iguales, la longitud de cada tramo varía hasta el doble
  // (p. ej. si el control coincide con un extremo): por eso el doble de pasos.
  const steps = Math.max(1, Math.ceil((2 * length) / MAX_STEP));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push({
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
      pressure: a.pressure + (b.pressure - a.pressure) * t,
    });
  }
};

/**
 * Convierte los puntos del trazo en un recorrido suave y denso: curvas
 * cuadráticas entre los puntos medios (el mismo criterio que la línea legacy),
 * aproximadas con tramos de como mucho MAX_STEP píxeles.
 *
 * Es incremental: cada curva se emite cuando llega el punto siguiente, así que
 * el trazo en curso va medio tramo por detrás. Con `isFinal` se emite el
 * último tramo hasta el punto final. Procesar los puntos por partes da
 * exactamente el mismo recorrido que de una vez.
 */
export const smoothPath = (
  state: SmoothPathState,
  points: readonly StrokePoint[],
  isFinal: boolean
): StrokePoint[] => {
  const out: StrokePoint[] = [];
  for (const point of points) {
    if (!state.previous || !state.cursor) {
      out.push(point);
      state.previous = point;
      state.cursor = point;
      continue;
    }
    const middle = midpoint(state.previous, point);
    flattenQuadratic(state.cursor, state.previous, middle, out);
    state.cursor = middle;
    state.previous = point;
  }
  if (isFinal && state.previous && state.cursor !== state.previous) {
    out.push(state.previous);
    state.cursor = state.previous;
  }
  return out;
};
