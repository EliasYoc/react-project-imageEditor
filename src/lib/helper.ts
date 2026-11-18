import type { Size } from "../editor/model/types";

/** Lee un archivo como data URL (para cargarlo en un <img>). */
export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.addEventListener("error", () =>
      reject(reader.error ?? new Error("No se pudo leer el archivo"))
    );
    reader.readAsDataURL(file);
  });

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
};

/**
 * Añade la extensión correcta según el tipo MIME, salvo que el nombre ya
 * termine en una extensión conocida (de imagen o de video).
 */
export const getDownloadFileName = (name: string, mimeType: string) => {
  const isVideo = mimeType.startsWith("video/");
  const fileName = name.trim() || (isVideo ? "video" : "imagen");
  if (/\.(png|jpe?g|webp|mp4)$/i.test(fileName)) return fileName;
  return `${fileName}.${EXTENSION_BY_MIME_TYPE[mimeType] || "png"}`;
};

/** Descarga un Blob como archivo usando un enlace temporal. */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // Se libera la memoria cuando el navegador ya empezó la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Tamaño reducido de una imagen para que su lado mayor mida `maxSide`,
 * manteniendo la proporción.
 */
export const fitToMaxSide = ({ width, height }: Size, maxSide: number) =>
  height < width
    ? { width: maxSide, height: (maxSide * height) / width }
    : { width: (maxSide * width) / height, height: maxSide };
