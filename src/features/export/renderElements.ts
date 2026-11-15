import { Layer } from "konva/lib/Layer";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { Label, Tag } from "konva/lib/shapes/Label";
import { Text } from "konva/lib/shapes/Text";
import { Stage } from "konva/lib/Stage";
import { ensureFont } from "../../editor/elements/fontLoader";
import { loadImage } from "../../editor/elements/imageCache";
import {
  imageNodeConfig,
  textNodeConfig,
} from "../../editor/elements/nodeConfig";
import type { EditorElement, Size } from "../../editor/model/types";

/**
 * Pinta los textos e imágenes en una escena de Konva aparte, fuera de
 * pantalla, del tamaño del documento y a la resolución de salida.
 *
 * Los nodos se crean con la misma configuración que en el lienzo, así que la
 * imagen exportada es lo que se veía: el texto sale vectorial y nítido (antes
 * se rasterizaba el DOM con html2canvas) y no depende del zoom, de la
 * selección ni del marco de transformación.
 */
export const renderElements = async (
  elements: readonly EditorElement[],
  docSize: Size,
  output: Size
) => {
  const ordered = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // Fuentes e imágenes listas antes de crear los nodos (Konva mide al crear).
  const images = new Map<string, HTMLImageElement>();
  await Promise.all(
    ordered.map(async (element) => {
      if (element.whatTask === "text") {
        await ensureFont(element.fontId, element.fontWeight);
      } else {
        images.set(element.id, await loadImage(element.src));
      }
    })
  );

  const stage = new Stage({
    container: document.createElement("div"),
    width: docSize.width,
    height: docSize.height,
  });
  const layer = new Layer();
  stage.add(layer);

  for (const element of ordered) {
    if (element.whatTask === "text") {
      const config = textNodeConfig(element);
      const label = new Label(config.label);
      label.add(new Tag(config.tag));
      label.add(new Text(config.text));
      layer.add(label);
    } else {
      const image = images.get(element.id);
      if (image)
        layer.add(new KonvaImage({ ...imageNodeConfig(element), image }));
    }
  }

  const canvas = stage.toCanvas({
    pixelRatio: output.width / docSize.width,
  });
  stage.destroy();
  return canvas;
};
