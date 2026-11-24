import { relativeLuminance } from "../model/color";
import type { Rgba, TextStyle } from "../model/types";

/**
 * Fondos sobre los que se ve un texto: blanco, o gris oscuro si el texto es
 * claro. Los usan la vista previa del panel «Fuente y estilo» y la capa que
 * oscurece el lienzo mientras se escribe.
 */
export const LIGHT_BACKDROP: Rgba = { r: 255, g: 255, b: 255, a: 1 };
export const DARK_BACKDROP: Rgba = { r: 43, g: 43, b: 43, a: 1 };

type PaintedStyle = Pick<
  TextStyle,
  "color" | "gradient" | "stroke" | "background"
>;

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * Luminosidad de los colores que se ven pintados junto al fondo: con caja,
 * solo la de la caja (las letras quedan dentro de ella); sin caja, el
 * relleno (la media de los colores de un degradado) y el contorno.
 */
const paintedLuminances = ({
  color,
  gradient,
  stroke,
  background,
}: PaintedStyle): number[] => {
  if (background.isEnabled) return [relativeLuminance(background.color)];
  const fill = gradient
    ? average(gradient.stops.map((stop) => relativeLuminance(stop.color)))
    : relativeLuminance(color);
  return stroke.isEnabled ? [fill, relativeLuminance(stroke.color)] : [fill];
};

/** Contraste de WCAG entre dos luminosidades (de 1 a 21). */
const contrast = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Fondo sobre el que se lee bien un texto: blanco, salvo que los colores del texto se vean
 * mejor sobre gris oscuro. Gana el fondo donde el color peor visto tiene más
 * contraste: un texto negro con contorno blanco (el de por defecto) se ve
 * sobre gris, donde ese contorno no desaparece. La sombra y la transparencia
 * no cuentan.
 */
export const readableBackdrop = (style: PaintedStyle): Rgba => {
  const luminances = paintedLuminances(style);
  const worstContrast = (backdrop: Rgba) =>
    Math.min(
      ...luminances.map((luminance) =>
        contrast(luminance, relativeLuminance(backdrop))
      )
    );
  return worstContrast(LIGHT_BACKDROP) >= worstContrast(DARK_BACKDROP)
    ? LIGHT_BACKDROP
    : DARK_BACKDROP;
};
