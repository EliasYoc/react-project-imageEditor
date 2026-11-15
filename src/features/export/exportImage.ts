import { paintStroke } from "../../editor/engine/brushes/paint";
import { paintFill } from "../../editor/engine/fill/paintFill";
import { editorStore } from "../../editor/store/editorStore";
import { selectElements, selectStrokes } from "../../editor/store/selectors";
import type { Photo, Size } from "../../editor/model/types";
import { canvasToBlob, createCanvas, get2dContext } from "../../lib/canvas";
import { getDownloadFileName } from "../../lib/helper";
import { saveImage } from "../../lib/saveImage";
import { renderElements } from "./renderElements";

/** Tamaño real de la imagen de fondo (la original, no la del lienzo). */
const sourceSize = (source: NonNullable<Photo["source"]>): Size =>
  source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };

/**
 * Compone la imagen final a la resolución de la foto original:
 * 1. el fondo (la foto completa, o blanco) y encima la capa de color o
 *    degradado, pintada también a esa resolución;
 * 2. los trazos, pintados de nuevo desde sus vectores a esa resolución (antes
 *    se estiraba el canvas reducido y salían borrosos);
 * 3. los textos e imágenes, con Konva y también a esa resolución.
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

  // Capa aparte para los trazos: el borrador solo debe quitar pintura, no la
  // foto del fondo.
  const paint = createCanvas(output);
  const paintCtx = get2dContext(paint);
  paintCtx.scale(
    paint.width / canvasSize.width,
    paint.height / canvasSize.height
  );
  // Búfer de cada trazo, a la resolución de salida (opacidad y modo de fusión).
  const scratch = createCanvas(output);
  for (const stroke of selectStrokes(state)) {
    paintStroke(paintCtx, stroke, scratch);
  }
  ctx.drawImage(paint, 0, 0);

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
  return saveImage(blob, getDownloadFileName(fileName, blob.type));
};
