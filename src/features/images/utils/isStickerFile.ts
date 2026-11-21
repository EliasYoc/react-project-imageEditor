import { STICKER_EXTENSIONS } from "../constants/insertableFiles";

/**
 * El archivo parece un sticker Lottie (por su extensión o su tipo). Si de
 * verdad lo es, se comprueba al leerlo (`readLottieFile`).
 */
export const isStickerFile = (file: File) =>
  file.type === "application/json" ||
  STICKER_EXTENSIONS.some((extension) =>
    file.name.toLowerCase().endsWith(extension)
  );
