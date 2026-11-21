import type { Rgba } from "./types";

/** Convierte un color del modelo a texto CSS: `rgba(r, g, b, a)`. */
export const rgbaToCss = ({ r, g, b, a }: Rgba): string =>
  `rgba(${r}, ${g}, ${b}, ${a})`;

/** Un canal sRGB (0–255) en luz lineal, como pide la fórmula de WCAG. */
const toLinearChannel = (value: number) => {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
};

/**
 * Luminosidad relativa de un color, de 0 (negro) a 1 (blanco), según WCAG.
 * Ignora la transparencia.
 */
export const relativeLuminance = ({
  r,
  g,
  b,
}: Pick<Rgba, "r" | "g" | "b">): number =>
  0.2126 * toLinearChannel(r) +
  0.7152 * toLinearChannel(g) +
  0.0722 * toLinearChannel(b);

const toHexByte = (value: number) =>
  Math.min(255, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, "0");

/** `#rrggbb` (sin la transparencia, que se ajusta aparte). */
export const rgbaToHex = ({ r, g, b }: Pick<Rgba, "r" | "g" | "b">) =>
  `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;

/** Lee `#rgb` o `#rrggbb` (con o sin #); null si no es un color válido. */
export const hexToRgb = (hex: string): Pick<Rgba, "r" | "g" | "b"> | null => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const digits =
    match[1].length === 3
      ? [...match[1]].map((digit) => digit + digit).join("")
      : match[1];
  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16),
  };
};
