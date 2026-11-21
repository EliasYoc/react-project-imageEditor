import type { Text as KonvaText } from "konva/lib/shapes/Text";
import type { Size } from "../model/types";

/** Un texto de ancho automático no pasa de esta parte del ancho del lienzo. */
const TEXT_MAX_WIDTH_RATIO = 0.9;

/** Ancho máximo de un texto, en píxeles del documento. */
export const maxTextWidth = (canvas: Size): number =>
  canvas.width * TEXT_MAX_WIDTH_RATIO;

/**
 * Pone a un nodo Text el ancho que le toca: el de su contenido, pero sin
 * pasar de `maxWidth`; si el texto es más ancho, Konva lo reparte en líneas.
 * Un texto con un ancho fijado (con las asas laterales) lo conserva.
 *
 * Hay que llamarla después de cada cambio del texto y antes de repartir el
 * degradado (`applyTextFill`), que depende del tamaño medido. Vuelve primero
 * al ancho automático: si no, un texto que se acorta se quedaría ancho.
 */
export const applyTextMaxWidth = (
  text: KonvaText,
  fixedWidth: number | null,
  maxWidth: number
) => {
  if (fixedWidth !== null) return;
  text.width("auto");
  if (text.width() > maxWidth) text.width(maxWidth);
};
