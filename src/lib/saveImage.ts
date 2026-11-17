import { downloadBlob } from "./helper";

export type SaveResult = "shared" | "downloaded" | "cancelled";

const isTouchDevice = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

const toFile = (blob: Blob, fileName: string) =>
  new File([blob], fileName, { type: blob.type });

/**
 * El archivo se entregará con la hoja de "Compartir" del sistema (en un
 * móvil cuyo navegador puede compartir archivos de ese tipo) y no con una
 * descarga.
 */
export const sharesFile = (blob: Blob, fileName: string) =>
  isTouchDevice() &&
  Boolean(navigator.canShare?.({ files: [toFile(blob, fileName)] }));

/**
 * Entrega al usuario la imagen o el video exportados.
 *
 * En el móvil abre la hoja de "Compartir" del sistema (desde ahí se puede
 * guardar en la galería o enviar), que es lo natural en un teléfono; en el
 * escritorio, o si el navegador no puede compartir archivos, lo descarga.
 *
 * `navigator.share` exige que el usuario acabe de tocar algo: si la
 * exportación tardó demasiado, el navegador lo rechaza (NotAllowedError) y se
 * descarga igualmente. Si el usuario cierra la hoja (AbortError), no se hace
 * nada más.
 */
export const saveImage = async (
  blob: Blob,
  fileName: string
): Promise<SaveResult> => {
  if (sharesFile(blob, fileName)) {
    try {
      await navigator.share({ files: [toFile(blob, fileName)] });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Cualquier otro error: se descarga como en el escritorio.
    }
  }

  downloadBlob(blob, fileName);
  return "downloaded";
};
