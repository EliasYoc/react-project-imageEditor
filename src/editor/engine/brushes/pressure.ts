/** Factor que aplica la presión: `min` con presión 0 y `max` con presión 1. */
export interface PressureRange {
  min: number;
  max: number;
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Factor de un parámetro (tamaño, opacidad…) según la presión.
 *
 * Sin presión real (ratón, dedo) se usa el máximo: el ratón dibuja con el
 * tamaño y la opacidad que eligió el usuario, no con la mitad.
 */
export const pressureFactor = (
  pressure: number,
  range: PressureRange,
  hasPressure: boolean
) => (hasPressure ? lerp(range.min, range.max, clamp01(pressure)) : range.max);
