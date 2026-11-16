import { blurLayers, revealBlurred } from "../../../editor/engine/brushes/blur";
import {
  paintBlurMask,
  paintStroke,
} from "../../../editor/engine/brushes/paint";
import { paintFill } from "../../../editor/engine/fill/paintFill";
import { editorStore } from "../../../editor/store/editorStore";
import {
  selectElements,
  selectStrokeLayers,
} from "../../../editor/store/selectors";
import type { Photo, Size, StrokeEntry } from "../../../editor/model/types";
import { canvasToBlob, createCanvas, get2dContext } from "../../../lib/canvas";
import { getDownloadFileName } from "../../../lib/helper";
import { saveImage } from "../../../lib/saveImage";
import { renderElements } from "./renderElements";

/** Tamaño real de la imagen de fondo (la original, no la del lienzo). */
const sourceSize = (source: NonNullable<Photo["source"]>): Size =>
  source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };

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
 * Compone la imagen final a la resolución de la foto original, en el mismo
 * orden que las capas del lienzo:
 * 1. el fondo (la foto completa, o blanco) y encima la capa de color o
 *    degradado, pintada también a esa resolución;
 * 2. ese fondo desenfocado, donde pasó el pincel de desenfoque;
 * 3. el resaltador, MULTIPLICADO con el fondo;
 * 4. la pintura (el resto de trazos);
 * 5. los textos e imágenes, con Konva y también a esa resolución.
 */
export const renderDocument = async () => {
  const state = editorStore.getState();
  const { photo, backdrop, canvasSize } = state;
  const output = photo.source ? sourceSize(photo.source) : canvasSize;

  const canvas = createCanvas(output);
  const ctx = get2dContext(canvas);
  if (photo.source) {
    ctx.drawImage(photo.source, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (backdrop.fill) {
    const fill = createCanvas(output);
    paintFill(get2dContext(fill), backdrop.fill, output);
    ctx.save();
    ctx.globalAlpha = backdrop.opacity;
    ctx.globalCompositeOperation = photo.source
      ? backdrop.blend
      : "source-over";
    ctx.drawImage(fill, 0, 0);
    ctx.restore();
  }

  const strokes = selectStrokeLayers(state);
  // Búfer de cada trazo, a la resolución de salida (opacidad y modo de fusión).
  const scratch = createCanvas(output);
  if (strokes.blur.length) {
    // Como en el lienzo (backgroundBlur.ts): la máscara de los trazos de
    // desenfoque, rellena con el fondo desenfocado.
    const blurred = paintStrokeLayer(
      strokes.blur,
      output,
      canvasSize,
      scratch,
      paintBlurMask
    );
    revealBlurred(
      get2dContext(blurred),
      blurLayers([{ image: canvas }], output)
    );
    ctx.drawImage(blurred, 0, 0);
  }
  if (strokes.highlight.length) {
    const highlight = paintStrokeLayer(
      strokes.highlight,
      output,
      canvasSize,
      scratch
    );
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(highlight, 0, 0);
    ctx.restore();
  }
  ctx.drawImage(
    paintStrokeLayer(strokes.paint, output, canvasSize, scratch),
    0,
    0
  );

  const elements = selectElements(state);
  if (elements.length) {
    const layer = await renderElements(elements, canvasSize, output);
    ctx.drawImage(layer, 0, 0, canvas.width, canvas.height);
  }

  return canvas;
};

/**
 * Compone la imagen con el formato del archivo original y la entrega: hoja de
 * compartir en el móvil o descarga en el escritorio.
 */
export const exportImage = async ({ fileName }: { fileName: string }) => {
  const { photo } = editorStore.getState();
  const canvas = await renderDocument();
  const mimeType = (photo.source && photo.mimeType) || "image/png";
  // Si el navegador no soporta el formato original (p. ej. GIF), toBlob
  // devuelve PNG: la extensión se calcula con el tipo real del blob.
  const blob = await canvasToBlob(canvas, mimeType);
  const savedName = getDownloadFileName(fileName, blob.type);
  return { result: await saveImage(blob, savedName), fileName: savedName };
};
