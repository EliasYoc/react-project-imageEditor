import { relativeLuminance } from "../../../editor/model/color";
import type { Rgba, Size, TextStyle } from "../../../editor/model/types";
import {
  DARK_BACKDROP,
  LIGHT_BACKDROP,
  PREVIEW_FONT_SIZE,
  PREVIEW_MAX_LINES,
  PREVIEW_MAX_LINE_LENGTH,
  PREVIEW_PADDING,
} from "../constants/textPreview";

const ELLIPSIS = "…";

const cutLine = (line: string) =>
  line.length > PREVIEW_MAX_LINE_LENGTH
    ? line.slice(0, PREVIEW_MAX_LINE_LENGTH) + ELLIPSIS
    : line;

/**
 * Las palabras de la vista previa: las del texto, pero solo las primeras
 * líneas y cada una hasta cierto largo (lo que importa es el estilo, y un
 * texto largo se vería diminuto).
 */
export const previewText = (text: string): string => {
  const lines = text.split("\n");
  const shown = lines.slice(0, PREVIEW_MAX_LINES).map(cutLine);
  if (lines.length > PREVIEW_MAX_LINES) shown[shown.length - 1] += ELLIPSIS;
  return shown.join("\n");
};

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
 * Fondo de la vista previa: blanco, salvo que los colores del texto se vean
 * mejor sobre gris oscuro. Gana el fondo donde el color peor visto tiene más
 * contraste: un texto negro con contorno blanco (el de por defecto) se ve
 * sobre gris, donde ese contorno no desaparece. La sombra y la transparencia
 * no cuentan.
 */
export const previewBackdrop = (style: PaintedStyle): Rgba => {
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

/**
 * Margen que necesitan el contorno y la sombra, que se pintan fuera de la
 * caja del texto (en píxeles del documento).
 */
export const textBleed = ({
  fontSize,
  stroke,
  shadow,
}: Pick<TextStyle, "fontSize" | "stroke" | "shadow">): number =>
  fontSize *
  Math.max(
    stroke.isEnabled ? stroke.width : 0,
    shadow.isEnabled ? shadow.offset + shadow.blur : 0
  );

export interface PreviewLayout {
  /** Cuántos píxeles de pantalla ocupa un píxel del documento. */
  scale: number;
  /** Esquina del texto, en píxeles del documento (ya escalados al dibujar). */
  x: number;
  y: number;
}

/**
 * Dónde y cuánto se dibuja el texto para que quede centrado en `area`: con
 * su tamaño de letra de vista previa, o más pequeño si no cabe (con el margen
 * del contorno y la sombra).
 */
export const previewLayout = (
  block: Size,
  fontSize: number,
  bleed: number,
  area: Size
): PreviewLayout => {
  const fits = (available: number, needed: number) =>
    (available - 2 * PREVIEW_PADDING) / Math.max(1, needed + 2 * bleed);
  const scale = Math.min(
    PREVIEW_FONT_SIZE / fontSize,
    fits(area.width, block.width),
    fits(area.height, block.height)
  );
  return {
    scale,
    x: (area.width / scale - block.width) / 2,
    y: (area.height / scale - block.height) / 2,
  };
};
