import { rgbaToCss } from "../model/color";
import type { Rgba } from "../model/types";
import { getFont, type FontId } from "./fonts";

/** Interlineado de los textos (en la Fase 4b pasa a ser un ajuste). */
export const TEXT_LINE_HEIGHT = 1.15;
/** Margen interior del texto respecto a su tamaño (área para tocarlo). */
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

export interface TextNodeInput extends ElementTransform {
  text: string;
  fontId: FontId;
  fontSize: number;
  fontWeight: number;
  color: Rgba;
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

/**
 * Configuración de Konva para un texto: un Label (grupo) con un Tag (la caja
 * de fondo, sin relleno por ahora) y el Text.
 *
 * La usan tanto los componentes del lienzo como la exportación, así que lo
 * que se ve y lo que se exporta no pueden diferir.
 */
export const textNodeConfig = (element: TextNodeInput) => ({
  label: transformConfig(element),
  tag: { listening: false },
  text: {
    text: element.text,
    fontFamily: getFont(element.fontId).family,
    fontSize: element.fontSize,
    // Konva admite el peso como número en fontStyle ("500", "900"…).
    fontStyle: String(element.fontWeight),
    fill: rgbaToCss(element.color),
    width: element.width ?? undefined,
    wrap: "word",
    lineHeight: TEXT_LINE_HEIGHT,
    padding: Math.round(element.fontSize * TEXT_PADDING_RATIO),
  },
});

export const imageNodeConfig = (element: ImageNodeInput) => ({
  ...transformConfig(element),
  width: element.width,
  height: element.height,
});
