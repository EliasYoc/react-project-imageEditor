import html2canvas from "html2canvas";
import {
  canvasToBlob,
  getCalculatedCoordsOfContainCanvas,
  getDominantCellSizeOfContainCanvas,
  transformElementSizeIntoCanvasElementSize,
} from "../../../editor/legacy/canvasUtils";
import { isEditorElement } from "../../../editor/model/types";
import { downloadBlob, getDownloadFileName } from "../../../lib/helper";

// Exportación legacy: compone la imagen de fondo, los trazos y los elementos
// (rasterizados con html2canvas desde el DOM). En la Fase 2 se sustituye por
// stage.toBlob() de Konva.

const imageOnLoad = (image) =>
  new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
  });

/** Dibuja los elementos (texto, imágenes) sobre `targetContext`, de atrás hacia delante. */
const drawElements = async (targetContext, canvas, log) => {
  // Se ordena una COPIA: ordenar el historial en el sitio rompía el "deshacer".
  const elements = log
    .filter(isEditorElement)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const element of elements) {
    const domElement = document.getElementById(element.id);
    if (!domElement) continue;
    try {
      const elementCanvas = await html2canvas(domElement, {
        backgroundColor: null,
        removeContainer: true,
      });

      const { width: shownWidth, height: shownHeight } =
        canvas.getBoundingClientRect();
      const { width, height } = getDominantCellSizeOfContainCanvas(
        shownWidth,
        shownHeight,
        canvas.height,
        canvas.width
      );
      const { newElementWidth, newElementHeight } =
        transformElementSizeIntoCanvasElementSize(
          element.realWidth,
          element.realHeight,
          width,
          height,
          canvas.width,
          canvas.height
        );
      const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
        canvasElement: canvas,
        canvasWidthPixel: canvas.width,
        canvasHeightPixel: canvas.height,
        xCoord: element.realLeft,
        yCoord: element.realTop,
      });

      const image = new Image();
      const loaded = imageOnLoad(image);
      image.src = elementCanvas.toDataURL("image/png");
      await loaded;
      targetContext.drawImage(
        image,
        coordX,
        coordY,
        newElementWidth,
        newElementHeight
      );
      elementCanvas.remove();
    } catch (error) {
      // Antes: alert(error). Un elemento que falla no debe impedir exportar el resto.
      console.error(error);
    }
  }
};

/**
 * Compone y descarga la imagen final.
 * @param {object} options
 * @param {HTMLCanvasElement} options.canvas canvas principal (trazos)
 * @param {{ image: HTMLImageElement | null, mimeType: string | null }} options.background
 * @param {Array} options.log historial del documento
 * @param {string} options.fileName nombre elegido por el usuario
 */
export const exportImage = async ({ canvas, background, log, fileName }) => {
  const { image } = background;
  const layerCopy = document.createElement("canvas");
  layerCopy.width = canvas.width;
  layerCopy.height = canvas.height;
  const layerCopyCtx = layerCopy.getContext("2d");

  layerCopyCtx.drawImage(
    canvas,
    0,
    0,
    image ? image.width : canvas.width,
    image ? image.height : canvas.height
  );
  await drawElements(layerCopyCtx, canvas, log);

  let finalCanvas = layerCopy;
  let mimeType = "image/png";

  if (image) {
    finalCanvas = document.createElement("canvas");
    finalCanvas.width = image.width;
    finalCanvas.height = image.height;
    const finalCtx = finalCanvas.getContext("2d");
    finalCtx.drawImage(image, 0, 0, image.width, image.height);
    finalCtx.drawImage(layerCopy, 0, 0, image.width, image.height);
    mimeType = background.mimeType || "image/png";
  }

  // Si el navegador no soporta el formato original (p. ej. GIF), toBlob
  // devuelve PNG: la extensión se calcula con el tipo real del blob.
  const blob = await canvasToBlob(finalCanvas, mimeType);
  downloadBlob(blob, getDownloadFileName(fileName, blob.type));
};
