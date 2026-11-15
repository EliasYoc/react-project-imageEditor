import type { Point, Size } from "../../model/types";

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Línea de un degradado lineal: de (x0, y0) a (x1, y1). */
export interface GradientLine {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Línea del degradado lineal según la especificación de CSS
 * (`linear-gradient(<ángulo>, …)`):
 *
 * - 0° apunta hacia arriba y el ángulo crece en sentido horario
 *   (90° = hacia la derecha, 180° = hacia abajo);
 * - la línea pasa por el centro y mide |W·sen θ| + |H·cos θ|, justo lo
 *   necesario para que las esquinas reciban el primer y el último color.
 */
export const linearGradientLine = (
  angle: number,
  { width, height }: Size
): GradientLine => {
  const theta = toRadians(angle);
  const dx = Math.sin(theta);
  const dy = -Math.cos(theta);
  const half =
    (Math.abs(width * Math.sin(theta)) + Math.abs(height * Math.cos(theta))) /
    2;
  const cx = width / 2;
  const cy = height / 2;
  return {
    x0: cx - dx * half,
    y0: cy - dy * half,
    x1: cx + dx * half,
    y1: cy + dy * half,
  };
};

/** Elipse de un degradado radial: centro y radios, en píxeles. */
export interface GradientEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Elipse del degradado radial como en CSS (`radial-gradient(ellipse
 * farthest-corner at x y, …)`, la forma por defecto): tiene las proporciones
 * de `farthest-side` y pasa por la esquina más lejana, así que sus radios son
 * los de `farthest-side` × √2.
 */
export const radialGradientEllipse = (
  center: Point,
  { width, height }: Size
): GradientEllipse => {
  const cx = center.x * width;
  const cy = center.y * height;
  const sideX = Math.max(cx, width - cx);
  const sideY = Math.max(cy, height - cy);
  return { cx, cy, rx: sideX * Math.SQRT2, ry: sideY * Math.SQRT2 };
};

/**
 * Ángulo inicial de `createConicGradient` (radianes, 0 = hacia la derecha)
 * para el `conic-gradient(from <ángulo>)` de CSS (0° = hacia arriba).
 */
export const conicStartAngle = (angle: number) => toRadians(angle - 90);
