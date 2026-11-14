export const debounce = (callback = () => {}, delay = 500) => {
  let idTimeout;
  return (...rest) => {
    clearTimeout(idTimeout);
    idTimeout = setTimeout(() => callback(...rest), delay);
  };
};

export const readFile = ({ file }) => {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const readable = new FileReader();
    readable.readAsDataURL(file);
    readable.addEventListener("load", () => {
      resolve(readable);
    });
    readable.addEventListener("error", () => {
      reject(readable);
    });
  });
};

const EXTENSION_BY_MIME_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Añade la extensión correcta según el tipo MIME, salvo que el nombre ya
 * termine en una extensión de imagen conocida.
 */
export const getDownloadFileName = (name, mimeType) => {
  const fileName = name.trim() || "imagen";
  if (/\.(png|jpe?g|webp)$/i.test(fileName)) return fileName;
  return `${fileName}.${EXTENSION_BY_MIME_TYPE[mimeType] || "png"}`;
};

/** Descarga un Blob como archivo usando un enlace temporal. */
export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // Se libera la memoria cuando el navegador ya empezó la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const reduceAspectRatioQualityOfIncomingImage = ({
  options,
  expectedMaxPixelsSize,
}) => {
  let ratio;
  if (options.height < options.width) {
    ratio = options.height / options.width;
    const newHeight = expectedMaxPixelsSize * ratio;
    return { newWidth: expectedMaxPixelsSize, newHeight };
  } else {
    ratio = options.width / options.height;
    const newWidth = expectedMaxPixelsSize * ratio;
    return { newWidth, newHeight: expectedMaxPixelsSize };
  }
};
