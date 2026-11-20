/** Un sticker Lottie: .json, o .tgs (el mismo JSON comprimido, de Telegram). */
export const STICKER_EXTENSIONS = [".json", ".tgs"] as const;

/** Lo que deja elegir el selector de archivos: imágenes (y GIFs) y stickers. */
export const INSERTABLE_FILE_TYPES = [
  "image/*",
  ...STICKER_EXTENSIONS,
  "application/json",
].join(",");
