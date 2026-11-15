import { createId } from "../../../lib/createId";
import type { ColorStop, Gradient, Rgba } from "../../model/types";

export const MIN_STOPS = 2;
export const MAX_STOPS = 8;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const sortStops = (stops: readonly ColorStop[]) =>
  [...stops].sort((a, b) => a.offset - b.offset);

const mix = (a: Rgba, b: Rgba, t: number): Rgba => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
  a: +(a.a + (b.a - a.a) * t).toFixed(3),
});

/** Color del degradado en una posición (interpolando entre sus paradas). */
export const colorAt = (stops: readonly ColorStop[], offset: number): Rgba => {
  const sorted = sortStops(stops);
  if (!sorted.length) return { r: 0, g: 0, b: 0, a: 1 };
  if (offset <= sorted[0].offset) return { ...sorted[0].color };
  for (let i = 1; i < sorted.length; i++) {
    const before = sorted[i - 1];
    const after = sorted[i];
    if (offset <= after.offset) {
      const span = after.offset - before.offset;
      return mix(
        before.color,
        after.color,
        span ? (offset - before.offset) / span : 0
      );
    }
  }
  return { ...sorted[sorted.length - 1].color };
};

/**
 * Parada nueva en `offset` con el color que ya tiene el degradado en ese
 * punto: añadirla no cambia cómo se ve hasta que se le cambia el color.
 */
export const addStop = (
  gradient: Gradient,
  offset: number,
  id: string = createId()
): Gradient => {
  if (gradient.stops.length >= MAX_STOPS) return gradient;
  const position = clamp01(offset);
  return {
    ...gradient,
    stops: [
      ...gradient.stops,
      { id, offset: position, color: colorAt(gradient.stops, position) },
    ],
  };
};

export const removeStop = (gradient: Gradient, id: string): Gradient =>
  gradient.stops.length <= MIN_STOPS
    ? gradient
    : { ...gradient, stops: gradient.stops.filter((stop) => stop.id !== id) };

const updateStop = (
  gradient: Gradient,
  id: string,
  patch: Partial<ColorStop>
): Gradient => ({
  ...gradient,
  stops: gradient.stops.map((stop) =>
    stop.id === id ? { ...stop, ...patch } : stop
  ),
});

export const moveStop = (gradient: Gradient, id: string, offset: number) =>
  updateStop(gradient, id, { offset: clamp01(offset) });

export const setStopColor = (gradient: Gradient, id: string, color: Rgba) =>
  updateStop(gradient, id, { color });
