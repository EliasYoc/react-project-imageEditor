const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const pad = (value: number) => String(value).padStart(2, "0");

/** La fecha local (toISOString daría la de UTC: de noche, ya sería mañana). */
const today = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Nombre sugerido: así exportar es un toque (antes era obligatorio
 * escribirlo). Con una foto abierta desde un archivo, su nombre + "-editada"
 * ("playa" → "playa-editada"); si no, "dibujo-AAAA-MM-DD".
 */
export const defaultExportName = (
  photo: { hasPhoto: boolean; fileName: string | null },
  date = new Date()
) => {
  if (photo.hasPhoto && photo.fileName) return `${photo.fileName}-editada`;
  return `${photo.hasPhoto ? "foto-editada" : "dibujo"}-${today(date)}`;
};

/** Extensión con la que saldrá el archivo: la de la foto, o PNG. */
export const exportExtension = (mimeType: string | null) =>
  (mimeType && EXTENSIONS[mimeType]) || "png";
