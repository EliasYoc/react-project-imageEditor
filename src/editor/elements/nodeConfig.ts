import { rgbaToCss } from "../model/color";
import type { TextStyle } from "../model/types";
import { getFont } from "./fonts";

/** Margen interior del texto sin caja, respecto a su tamaño (área para tocarlo). */
const TEXT_PADDING_RATIO = 0.15;

/** Posición y transformación de un elemento, en píxeles del documento. */
export interface ElementTransform {
  id: string;
  x: number;
  y: number;
  /** Giro en grados. */
  rotation: number;
  /** Escala uniforme. */
  scale: number;
}

export interface TextNodeInput extends ElementTransform, TextStyle {
  text: string;
  /** Ancho de ajuste en píxeles del documento; null = ancho automático. */
  width: number | null;
}

export interface ImageNodeInput extends ElementTransform {
  width: number;
  height: number;
}

const transformConfig = ({ id, x, y, rotation, scale }: ElementTransform) => ({
  id,
  x,
  y,
  rotation,
  scaleX: scale,
  scaleY: scale,
});

/** Margen interior del texto (con caja de fondo, el de la caja). */
export const textPadding = ({
  fontSize,
  background,
}: Pick<TextStyle, "fontSize" | "background">) =>
  Math.round(
    fontSize * (background.isEnabled ? background.padding : TEXT_PADDING_RATIO)
  );

/**
 * Configuración de Konva para un texto: un Label (grupo) con un Tag (la caja
 * de fondo) y el Text.
 *
 * La usan tanto los componentes del lienzo como la exportación, así que lo
 * que se ve y lo que se exporta no pueden diferir.
 */
export const textNodeConfig = (element: TextNodeInput) => {
  const { fontSize, stroke, shadow, background } = element;
  return {
    label: transformConfig(element),
    tag: {
      listening: false,
      fill: background.isEnabled ? rgbaToCss(background.color) : undefined,
      cornerRadius: fontSize * background.radius,
    },
    text: {
      text: element.text,
      fontFamily: getFont(element.fontId).family,
      fontSize,
      // Konva admite el peso como número en fontStyle ("500", "900"…).
      fontStyle: String(element.fontWeight),
      fill: rgbaToCss(element.color),
      width: element.width ?? undefined,
      wrap: "word",
      align: element.align,
      lineHeight: element.lineHeight,
      padding: textPadding(element),
      // Contorno POR FUERA: se pinta primero y el relleno tapa su mitad
      // interior (si no, el contorno se come la letra).
      strokeEnabled: stroke.isEnabled,
      stroke: rgbaToCss(stroke.color),
      // ×2: la mitad interior del trazo queda tapada por el relleno.
      strokeWidth: fontSize * stroke.width * 2,
      fillAfterStrokeEnabled: true,
      lineJoin: "round" as const,
      shadowEnabled: shadow.isEnabled,
      shadowColor: rgbaToCss(shadow.color),
      shadowBlur: fontSize * shadow.blur,
      shadowOffsetX: fontSize * shadow.offset,
      shadowOffsetY: fontSize * shadow.offset,
    },
  };
};

export const imageNodeConfig = (element: ImageNodeInput) => ({
  ...transformConfig(element),
  width: element.width,
  height: element.height,
});
