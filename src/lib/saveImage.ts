import { downloadBlob } from "./helper";

export type SaveResult = "shared" | "downloaded" | "cancelled";

const isTouchDevice = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

/**
 * Entrega la imagen exportada al usuario.
 *
 * En el móvil abre la hoja de "Compartir" del sistema (desde ahí se puede
 * guardar en la galería o enviar), que es lo natural en un teléfono; en el
 * escritorio, o si el navegador no puede compartir archivos, la descarga.
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
  const file = new File([blob], fileName, { type: blob.type });

  if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
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
