import type { Size } from "../editor/model/types";

/** Canvas fuera del documento con el tamaño indicado (en píxeles enteros). */
export const createCanvas = ({ width, height }: Size): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  return canvas;
};

/** Contexto 2D de un canvas; falla con un mensaje claro si no se puede crear. */
export const get2dContext = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no pudo crear un contexto 2D");
  return ctx;
};

/** Versión con promesa de `canvas.toBlob`. */
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType = "image/png",
  quality?: number
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("No se pudo exportar la imagen")),
      mimeType,
      quality
    );
  });
