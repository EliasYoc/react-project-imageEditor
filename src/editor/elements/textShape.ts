import { Label, Tag } from "konva/lib/shapes/Label";
import { Text } from "konva/lib/shapes/Text";
import { textNodeConfig, type TextNodeInput } from "./nodeConfig";
import { applyTextFill } from "./textGradient";

/**
 * Crea a mano los nodos de Konva de un texto (el Label con su caja de fondo y
 * el Text, con el degradado ya repartido). La usan la exportación y la vista
 * previa del panel «Fuente y estilo»: el lienzo de la pantalla los dibuja con
 * componentes de react-konva, pero con la misma configuración
 * (`textNodeConfig`), así que los tres se ven igual.
 */
export const createTextLabel = (element: TextNodeInput) => {
  const config = textNodeConfig(element);
  const label = new Label(config.label);
  const text = new Text(config.text);
  // Igual que en el lienzo: el degradado se reparte en la caja ya medida.
  applyTextFill(text, element.gradient);
  label.add(new Tag(config.tag));
  label.add(text);
  return { label, text };
};
