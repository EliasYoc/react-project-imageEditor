import {
  DARK_BACKDROP,
  readableBackdrop,
} from "../../elements/readableBackdrop";
import { rgbaToCss } from "../../model/color";
import type { TextElement } from "../../model/types";

/** Opacidad de la capa que tapa el lienzo mientras se escribe. */
const EDITING_BACKDROP_OPACITY = 0.45;

/**
 * Color de esa capa: oscura. Solo un texto sin caja de fondo que se leería
 * mal sobre oscuro (p. ej. negro) la tiene clara (`readableBackdrop`); con
 * caja, la caja ya hace que se lea.
 */
export const editingBackdropColor = (element: TextElement) => {
  const color = element.background.isEnabled
    ? DARK_BACKDROP
    : readableBackdrop(element);
  return rgbaToCss({ ...color, a: EDITING_BACKDROP_OPACITY });
};
