import { paintStroke } from "../../editor/engine/renderStroke";
import { viewStore } from "../../editor/stage/viewStore";
import { editorStore } from "../../editor/store/editorStore";
import { selectElements, selectStrokes } from "../../editor/store/selectors";
import type { Background, Size } from "../../editor/model/types";
import { canvasToBlob, createCanvas, get2dContext } from "../../lib/canvas";
import { getDownloadFileName } from "../../lib/helper";
import { saveImage } from "../../lib/saveImage";
import { drawDomElements } from "./legacy/drawDomElements";

/** Tamaño real de la imagen de fondo (la original, no la del lienzo). */
const sourceSize = (source: NonNullable<Background["source"]>): Size =>
  source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Ejecuta `task` con la vista ajustada a pantalla y después devuelve el zoom
 * que había. html2canvas no se lleva bien con elementos dentro de una capa
 * escalada con CSS: así los textos e imágenes se miden y rasterizan sin zoom.
 */
const withFittedView = async <T>(task: () => Promise<T>) => {
  const { view, isFitted } = viewStore.getState();
  // Fuera del modo Dibujar la vista ya se muestra ajustada.
  if (isFitted || editorStore.getState().mode !== "draw") return task();
  viewStore.getState().fitToScreen();
  // Un frame para que React aplique la vista nueva y otro para el layout.
  await nextFrame();
  await nextFrame();
  try {
    return await task();
  } finally {
    viewStore.getState().setView(view);
  }
};

/**
 * Compone la imagen final a la resolución de la foto original:
 * 1. el fondo (la foto completa, o blanco);
 * 2. los trazos, pintados de nuevo desde sus vectores a esa resolución (antes
 *    se estiraba el canvas reducido y salían borrosos);
 * 3. los textos e imágenes (legacy: html2canvas hasta la Fase 4).
 */
export const renderDocument = async (documentFrame: HTMLElement | null) => {
  const state = editorStore.getState();
  const { background, canvasSize } = state;
  const output = background.source ? sourceSize(background.source) : canvasSize;

  const canvas = createCanvas(output);
  const ctx = get2dContext(canvas);
  if (background.source) {
    ctx.drawImage(background.source, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Capa aparte para los trazos: el borrador solo debe quitar pintura, no la
  // foto del fondo.
  const paint = createCanvas(output);
  const paintCtx = get2dContext(paint);
  paintCtx.scale(
    paint.width / canvasSize.width,
    paint.height / canvasSize.height
  );
  for (const stroke of selectStrokes(state)) paintStroke(paintCtx, stroke);
  ctx.drawImage(paint, 0, 0);

  const elements = selectElements(state);
  if (elements.length && documentFrame) {
    await withFittedView(() => drawDomElements(ctx, elements, documentFrame));
  }

  return canvas;
};

/**
 * Compone la imagen con el formato del archivo original y la entrega: hoja de
 * compartir en el móvil o descarga en el escritorio.
 */
export const exportImage = async ({
  fileName,
  documentFrame,
}: {
  fileName: string;
  documentFrame: HTMLElement | null;
}) => {
  const { background } = editorStore.getState();
  const canvas = await renderDocument(documentFrame);
  const mimeType = (background.source && background.mimeType) || "image/png";
  // Si el navegador no soporta el formato original (p. ej. GIF), toBlob
  // devuelve PNG: la extensión se calcula con el tipo real del blob.
  const blob = await canvasToBlob(canvas, mimeType);
  return saveImage(blob, getDownloadFileName(fileName, blob.type));
};
