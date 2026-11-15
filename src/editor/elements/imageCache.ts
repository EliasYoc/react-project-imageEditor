const loading = new Map<string, Promise<HTMLImageElement>>();
const ready = new Map<string, HTMLImageElement>();

/**
 * Carga una imagen una sola vez por `src` (la usan el lienzo y la
 * exportación: no se descarga ni decodifica dos veces).
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  const cached = loading.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      ready.set(src, image);
      resolve(image);
    };
    image.onerror = () => {
      loading.delete(src);
      reject(new Error("No se pudo cargar la imagen"));
    };
    image.src = src;
  });
  loading.set(src, promise);
  return promise;
};

/** La imagen si ya terminó de cargar (sin esperar). */
export const getLoadedImage = (src: string) => ready.get(src) ?? null;
