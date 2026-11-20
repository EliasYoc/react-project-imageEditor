import { currentAnimationTime } from "../../../editor/stage/animationClock";
import { editorStore } from "../../../editor/store/editorStore";
import { selectVideo } from "../../../editor/store/selectors";
import type { Photo, Size } from "../../../editor/model/types";
import { canvasToBlob } from "../../../lib/canvas";
import { getDownloadFileName } from "../../../lib/helper";
import { saveImage } from "../../../lib/saveImage";
import {
  createDocumentCompositor,
  drawStillBackground,
} from "./documentCompositor";

/** Tamaño real de la imagen de fondo (la original, no la del lienzo). */
const sourceSize = (source: NonNullable<Photo["source"]>): Size =>
  source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };

/**
 * Compone la imagen final a la resolución de la foto original: el fondo (la
 * foto completa, o blanco) y encima el resto del documento, en el mismo orden
 * que las capas del lienzo (ver `createDocumentCompositor`).
 *
 * Con un video de fondo, la imagen es su fotograma actual, al tamaño del
 * documento. Los GIFs salen en el fotograma que se ve en el lienzo.
 */
export const renderDocument = async () => {
  const state = editorStore.getState();
  const { photo, canvasSize } = state;
  const output = photo.source ? sourceSize(photo.source) : canvasSize;
  const background = photo.source ?? photo.video?.element ?? null;
  const seconds = currentAnimationTime(selectVideo(state));

  const compositor = await createDocumentCompositor(state, output);
  try {
    return await compositor.render(drawStillBackground(background), seconds);
  } finally {
    compositor.dispose();
  }
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
