import type { View } from "../engine/viewport";
import type { ElementTransform } from "./nodeConfig";

/**
 * Posición del <textarea> con el que se edita un texto: exactamente encima
 * del nodo de Konva, con el mismo giro y la misma escala (la de la vista por
 * la del elemento). Las coordenadas son relativas al área del lienzo.
 *
 * El textarea usa el tamaño de letra del documento y se escala con CSS: así
 * el texto se ve igual que en el lienzo con cualquier zoom.
 */
export const textEditorBox = (element: ElementTransform, view: View) => ({
  left: view.x + element.x * view.scale,
  top: view.y + element.y * view.scale,
  transform: `rotate(${element.rotation}deg) scale(${view.scale * element.scale})`,
  transformOrigin: "0 0",
});
