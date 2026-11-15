import type { Photo, Size } from "../../editor/model/types";
import { createCanvas, get2dContext } from "../../lib/canvas";
import { fitToMaxSide, readFileAsDataUrl } from "../../lib/helper";

/** Las imágenes más grandes que esto se reducen a MAX_IMAGE_SIDE píxeles. */
const HEAVY_IMAGE_SIDE = 2800;
const MAX_IMAGE_SIDE = 2048;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen"));
    image.src = src;
  });

/** El nombre del archivo sin la extensión ("playa.jpg" → "playa"). */
export const baseName = (fileName: string) =>
  fileName.replace(/\.[^./\\]+$/, "").trim() || null;

/** El archivo es una imagen que el navegador puede abrir. */
export const isImageFile = (file: File | null | undefined): file is File =>
  !!file && file.type.startsWith("image/");

/**
 * Lee un archivo de imagen y lo prepara como foto del documento (lo comparten
 * el botón "Abrir una foto", arrastrar y soltar, y pegar):
 *
 * - `source`: la imagen original, que es la que se exporta;
 * - `preview`: una copia con el tamaño del documento para el lienzo (las
 *   imágenes enormes se reducen a 2048 px). Es un canvas, no un dataURL: no
 *   hay que volver a codificarla ni perder calidad.
 */
export const openImageFile = async (
  file: File
): Promise<Photo & { size: Size }> => {
  const image = await loadImage(await readFileAsDataUrl(file));
  const isHeavy =
    image.width > HEAVY_IMAGE_SIDE || image.height > HEAVY_IMAGE_SIDE;
  const size = isHeavy
    ? fitToMaxSide(image, MAX_IMAGE_SIDE)
    : { width: image.width, height: image.height };

  const preview = createCanvas(size);
  get2dContext(preview).drawImage(image, 0, 0, preview.width, preview.height);

  return {
    source: image,
    preview,
    mimeType: file.type,
    fileName: baseName(file.name),
    size: { width: preview.width, height: preview.height },
  };
};
