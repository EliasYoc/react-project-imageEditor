import type { Size, TextStyle } from "../../../editor/model/types";
import {
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
