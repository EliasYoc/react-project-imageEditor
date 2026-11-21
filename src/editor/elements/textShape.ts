import { Label, Tag } from "konva/lib/shapes/Label";
import { Text } from "konva/lib/shapes/Text";
import { textNodeConfig, type TextNodeInput } from "./nodeConfig";
import { applyTextFill } from "./textGradient";
import { applyTextMaxWidth } from "./textWidth";

/**
 * Crea a mano los nodos de Konva de un texto (el Label con su caja de fondo y
 * el Text, con su tope de ancho y el degradado ya repartido). La usan la
 * exportación y la vista previa del panel «Fuente y estilo»: el lienzo de la
 * pantalla los dibuja con componentes de react-konva, pero con la misma
 * configuración (`textNodeConfig`) y los mismos pasos, así que los tres se
 * ven igual.
 *
 * `maxWidth` es lo máximo que puede medir un texto de ancho automático (ver
 * `maxTextWidth`).
 */
export const createTextLabel = (element: TextNodeInput, maxWidth: number) => {
  const config = textNodeConfig(element);
  const label = new Label(config.label);
  const text = new Text(config.text);
  // Igual que en el lienzo: primero el tope de ancho y, con la caja ya
  // medida, el degradado.
  applyTextMaxWidth(text, element.width, maxWidth);
  applyTextFill(text, element.gradient);
  label.add(new Tag(config.tag));
  label.add(text);
  return { label, text };
};
