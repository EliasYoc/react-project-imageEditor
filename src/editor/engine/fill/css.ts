import { rgbaToCss } from "../../model/color";
import type { ColorStop, Gradient } from "../../model/types";
import { sortStops } from "./stops";

const percent = (value: number) => `${+(value * 100).toFixed(2)}%`;

const cssStops = (stops: readonly ColorStop[]) =>
  sortStops(stops)
    .map((stop) => `${rgbaToCss(stop.color)} ${percent(stop.offset)}`)
    .join(", ");

/**
 * El mismo degradado en CSS. Como el motor usa la geometría de CSS, una
 * vista previa con este `background` se ve igual que el lienzo.
 *
 * `radialShape`: el fondo usa la elipse de CSS; el texto, un círculo.
 */
export const gradientToCss = (
  gradient: Gradient,
  radialShape: "ellipse" | "circle" = "ellipse"
) => {
  const stops = cssStops(gradient.stops);
  const at = `${percent(gradient.center.x)} ${percent(gradient.center.y)}`;
  switch (gradient.type) {
    case "linear":
      return `linear-gradient(${gradient.angle}deg, ${stops})`;
    case "radial":
      return `radial-gradient(${radialShape} farthest-corner at ${at}, ${stops})`;
    case "conic":
      return `conic-gradient(from ${gradient.angle}deg at ${at}, ${stops})`;
  }
};

/** Las paradas de izquierda a derecha (la barra para editarlas). */
export const stopsToCss = (stops: readonly ColorStop[]) =>
  `linear-gradient(90deg, ${cssStops(stops)})`;
