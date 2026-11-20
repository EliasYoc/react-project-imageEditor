import { Layer } from "konva/lib/Layer";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { Label, Tag } from "konva/lib/shapes/Label";
import { Text } from "konva/lib/shapes/Text";
import { Stage } from "konva/lib/Stage";
import {
  canAnimateImages,
  openAnimationReader,
  type AnimationReader,
} from "../../../editor/elements/animatedImage";
import { ensureFont } from "../../../editor/elements/fontLoader";
import { loadImage } from "../../../editor/elements/imageCache";
import {
  imageNodeConfig,
  textNodeConfig,
} from "../../../editor/elements/nodeConfig";
import { applyTextFill } from "../../../editor/elements/textGradient";
import type {
  EditorElement,
  ImageElement,
  Size,
} from "../../../editor/model/types";

export interface ElementsRenderer {
  /** Hay algún GIF o sticker: lo que se pinta cambia con el tiempo. */
  isAnimated: boolean;
  /**
   * Pinta los elementos como se ven en el segundo `seconds`. Devuelve
   * SIEMPRE el mismo canvas: la siguiente llamada lo vuelve a pintar.
   */
  render: (seconds: number) => Promise<HTMLCanvasElement>;
  /** Suelta la escena de Konva, los GIFs y los stickers. */
  dispose: () => void;
}

/**
 * Lado mayor, en píxeles, con el que se pinta un sticker al exportar: como
 * mucho este, aunque salga más grande (pintarlo cuesta según sus píxeles).
 */
const MAX_STICKER_SIDE = 2048;

/**
 * Lado con el que se exporta cada sticker (por archivo): el de su copia más
 * grande en el archivo de salida, para que salga nítido (es vectorial).
 */
const stickerSides = (images: readonly ImageElement[], outputScale: number) => {
  const sides = new Map<string, number>();
  for (const { animation, src, width, height, scale } of images) {
    if (animation !== "lottie") continue;
    const side = Math.max(width, height) * scale * outputScale;
    sides.set(
      src,
      Math.min(MAX_STICKER_SIDE, Math.max(sides.get(src) ?? 0, side))
    );
  }
  return sides;
};

/**
 * La imagen de cada elemento de imagen: la de `imageCache` o, si se mueve
 * (un GIF que se puede animar o un sticker), el canvas de su lector, que
 * pinta el fotograma de cada momento. Los elementos con el mismo archivo
 * comparten lector.
 *
 * Si un GIF no se puede abrir, sale quieto, como se ve en el lienzo; un
 * sticker que no se puede abrir no sale (tampoco se ve en el lienzo).
 */
const loadImages = async (
  images: readonly ImageElement[],
  outputScale: number
) => {
  const sides = stickerSides(images, outputScale);
  const readers = new Map<string, Promise<AnimationReader | null>>();
  const openReader = ({ src, animation }: ImageElement) => {
    let reader = readers.get(src);
    if (!reader) {
      const opening =
        animation === "lottie"
          ? import("../../../editor/elements/lottieSticker").then((module) =>
              module.openLottieReader(src, sides.get(src) ?? 0)
            )
          : openAnimationReader(src);
      reader = opening.catch((error: unknown) => {
        console.error(error);
        return null;
      });
      readers.set(src, reader);
    }
    return reader;
  };

  const sources = new Map<string, CanvasImageSource>();
  await Promise.all(
    images.map(async (element) => {
      const isMoving =
        element.animation === "lottie" ||
        (element.animation === "frames" && canAnimateImages());
      const reader = isMoving ? await openReader(element) : null;
      if (reader) sources.set(element.id, reader.canvas);
      else if (element.animation !== "lottie") {
        sources.set(element.id, await loadImage(element.src));
      }
    })
  );
  const animations = (await Promise.all(readers.values())).filter(
    (reader) => reader !== null
  );
  return { sources, animations };
};

/**
 * Prepara los textos e imágenes para pintarlos en una escena de Konva
 * aparte, fuera de pantalla, del tamaño del documento y a la resolución de
 * salida.
 *
 * Los nodos se crean con la misma configuración que en el lienzo, así que la
 * imagen exportada es lo que se veía: el texto sale vectorial y nítido (antes
 * se rasterizaba el DOM con html2canvas) y no depende del zoom, de la
 * selección ni del marco de transformación.
 *
 * La escena se crea una vez. Con GIFs, cada `render` solo cambia el
 * fotograma de cada uno y vuelve a pintar la capa en su propio canvas (sin
 * crear otro en cada fotograma de un video).
 */
export const createElementsRenderer = async (
  elements: readonly EditorElement[],
  docSize: Size,
  output: Size
): Promise<ElementsRenderer> => {
  const ordered = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  /** Píxeles de salida por píxel del documento. */
  const outputScale = output.width / docSize.width;

  // Fuentes e imágenes listas antes de crear los nodos (Konva mide al crear).
  const images = ordered.filter(
    (element): element is ImageElement => element.whatTask === "image"
  );
  const [{ sources, animations }] = await Promise.all([
    loadImages(images, outputScale),
    Promise.all(
      ordered.map((element) =>
        element.whatTask === "text"
          ? ensureFont(element.fontId, element.fontWeight)
          : null
      )
    ),
  ]);

  const stage = new Stage({
    container: document.createElement("div"),
    width: docSize.width,
    height: docSize.height,
  });
  // Sin eventos: así no se pinta también su canvas de detección.
  const layer = new Layer({ listening: false });
  stage.add(layer);
  // La capa se pinta directamente a la resolución de salida.
  layer.getCanvas().setPixelRatio(outputScale);

  for (const element of ordered) {
    if (element.whatTask === "text") {
      const config = textNodeConfig(element);
      const label = new Label(config.label);
      const text = new Text(config.text);
      // Igual que en el lienzo: el degradado se reparte en la caja ya medida.
      applyTextFill(text, element.gradient);
      label.add(new Tag(config.tag));
      label.add(text);
      layer.add(label);
    } else {
      const image = sources.get(element.id);
      if (image)
        layer.add(new KonvaImage({ ...imageNodeConfig(element), image }));
    }
  }

  return {
    isAnimated: animations.length > 0,
    render: async (seconds) => {
      await Promise.all(animations.map((gif) => gif.drawFrameAt(seconds)));
      layer.draw();
      return layer.getNativeCanvasElement();
    },
    dispose: () => {
      stage.destroy();
      for (const gif of animations) gif.close();
    },
  };
};
