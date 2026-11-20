import { blurLayers, revealBlurred } from "../../../editor/engine/brushes/blur";
import {
  paintBlurMask,
  paintStroke,
} from "../../../editor/engine/brushes/paint";
import { paintFill } from "../../../editor/engine/fill/paintFill";
import type { Size, StrokeEntry } from "../../../editor/model/types";
import type { EditorStore } from "../../../editor/store/editorStore";
import {
  selectElements,
  selectHasBackground,
  selectStrokeLayers,
} from "../../../editor/store/selectors";
import { createCanvas, get2dContext } from "../../../lib/canvas";
import {
  createElementsRenderer,
  type ElementsRenderer,
} from "./renderElements";

/**
 * Pinta el fondo de un fotograma (la foto, un fotograma del video, o blanco)
 * en `ctx`, cubriendo todo el canvas, que mide `size`.
 */
export type DrawBackground = (
  ctx: CanvasRenderingContext2D,
  size: Size
) => void;

export interface DocumentCompositor {
  /**
   * Compone el documento sobre el fondo que pinta `drawBackground`, con los
   * GIFs en su fotograma del segundo `seconds`. Devuelve SIEMPRE el mismo
   * canvas: la siguiente llamada lo vuelve a pintar.
   */
  render: (
    drawBackground: DrawBackground,
    seconds: number
  ) => Promise<HTMLCanvasElement>;
  /** Suelta lo que guarda entre fotogramas (la escena de los GIFs). */
  dispose: () => void;
}

/**
 * Pinta unos trazos en una capa aparte (el borrador solo debe quitar pintura,
 * no la foto del fondo), de nuevo desde sus vectores y a la resolución de
 * salida: antes se estiraba el canvas reducido y salían borrosos.
 */
const paintStrokeLayer = (
  strokes: readonly StrokeEntry[],
  output: Size,
  docSize: Size,
  scratch: HTMLCanvasElement,
  paint: typeof paintBlurMask = paintStroke
) => {
  const layer = createCanvas(output);
  const ctx = get2dContext(layer);
  ctx.scale(output.width / docSize.width, output.height / docSize.height);
  for (const stroke of strokes) paint(ctx, stroke, scratch);
  return layer;
};

/**
 * Pinta la capa de los elementos cubriendo todo el canvas. Konva redondea su
 * tamaño a píxeles enteros: se estira al de salida para que encaje justo.
 */
const drawLayer = (
  ctx: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  output: Size
) => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer, 0, 0, output.width, output.height);
  ctx.restore();
};

/**
 * Prepara la composición del documento a la resolución `output`, en el mismo
 * orden que las capas del lienzo:
 * 1. el fondo y encima la capa de color o degradado;
 * 2. ese fondo desenfocado, donde pasó el pincel de desenfoque;
 * 3. el resaltador, MULTIPLICADO con el fondo;
 * 4. la pintura (el resto de trazos) y los textos e imágenes, con Konva.
 *
 * Lo que no depende del fondo (la capa de color, la máscara del desenfoque,
 * el resaltador, la pintura y los elementos) se pinta UNA vez, aquí. `render`
 * solo repite lo que cambia con el fondo, así que sirve igual para una imagen
 * (una llamada) que para cada fotograma de un video. Con GIFs, los elementos
 * cambian con el tiempo: se vuelven a pintar en cada `render`.
 */
export const createDocumentCompositor = async (
  state: EditorStore,
  output: Size
): Promise<DocumentCompositor> => {
  const { backdrop, canvasSize } = state;
  const strokes = selectStrokeLayers(state);
  const elements = selectElements(state);

  const canvas = createCanvas(output);
  const ctx = get2dContext(canvas);
  // Búfer de cada trazo, a la resolución de salida (opacidad y modo de fusión).
  const scratch = createCanvas(output);

  let fill: HTMLCanvasElement | null = null;
  if (backdrop.fill) {
    fill = createCanvas(output);
    paintFill(get2dContext(fill), backdrop.fill, output);
  }
  // El modo de fusión solo tiene sentido sobre una foto o un video.
  const fillBlend = selectHasBackground(state) ? backdrop.blend : "source-over";

  // Como en el lienzo (backgroundBlur.ts): la máscara de los trazos de
  // desenfoque, que en cada `render` se rellena con el fondo desenfocado.
  const blurMask = strokes.blur.length
    ? paintStrokeLayer(strokes.blur, output, canvasSize, scratch, paintBlurMask)
    : null;
  const highlight = strokes.highlight.length
    ? paintStrokeLayer(strokes.highlight, output, canvasSize, scratch)
    : null;

  // Pintura y elementos en una sola capa: van seguidos y siempre encima. Con
  // GIFs, los elementos van aparte y se pintan en cada `render`.
  let overlay = strokes.paint.length
    ? paintStrokeLayer(strokes.paint, output, canvasSize, scratch)
    : null;
  let animatedElements: ElementsRenderer | null = null;
  if (elements.length) {
    const renderer = await createElementsRenderer(elements, canvasSize, output);
    if (renderer.isAnimated) {
      animatedElements = renderer;
    } else {
      overlay ??= createCanvas(output);
      drawLayer(get2dContext(overlay), await renderer.render(0), output);
      renderer.dispose();
    }
  }

  // Copia desenfocada del fondo: se reutiliza de un fotograma al siguiente.
  let blurred: HTMLCanvasElement | null = null;

  const render = async (drawBackground: DrawBackground, seconds: number) => {
    // Antes de tocar el canvas: mientras se espera a los GIFs, sigue entero.
    const elementsLayer = await animatedElements?.render(seconds);

    ctx.save();
    drawBackground(ctx, output);
    ctx.restore();

    if (fill) {
      ctx.save();
      ctx.globalAlpha = backdrop.opacity;
      ctx.globalCompositeOperation = fillBlend;
      ctx.drawImage(fill, 0, 0);
      ctx.restore();
    }

    if (blurMask) {
      blurred = blurLayers([{ image: canvas }], output, { into: blurred });
      // La máscara no se toca (sirve para el fotograma siguiente): se copia
      // al búfer de trazo, que ya está libre, y ahí se rellena.
      const patch = get2dContext(scratch);
      patch.setTransform(1, 0, 0, 1, 0, 0);
      patch.globalAlpha = 1;
      patch.globalCompositeOperation = "source-over";
      patch.clearRect(0, 0, scratch.width, scratch.height);
      patch.drawImage(blurMask, 0, 0);
      revealBlurred(patch, blurred);
      ctx.drawImage(scratch, 0, 0);
    }

    if (highlight) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(highlight, 0, 0);
      ctx.restore();
    }

    if (overlay) ctx.drawImage(overlay, 0, 0);
    if (elementsLayer) drawLayer(ctx, elementsLayer, output);
    return canvas;
  };

  return { render, dispose: () => animatedElements?.dispose() };
};
