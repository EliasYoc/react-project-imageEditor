import type { Rgba } from "./types";

/** Convierte un color del modelo a texto CSS: `rgba(r, g, b, a)`. */
export const rgbaToCss = ({ r, g, b, a }: Rgba): string =>
  `rgba(${r}, ${g}, ${b}, ${a})`;
