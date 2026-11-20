import { loadImageElement } from "../../lib/loadImageElement";

const loading = new Map<string, Promise<HTMLImageElement>>();
const ready = new Map<string, HTMLImageElement>();

/**
 * Carga una imagen una sola vez por `src` (la usan el lienzo y la
 * exportación: no se descarga ni decodifica dos veces).
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  const cached = loading.get(src);
  if (cached) return cached;
  const promise = loadImageElement(src).then(
    (image) => {
      ready.set(src, image);
      return image;
    },
    (error: unknown) => {
      // Un fallo no se guarda: la próxima vez se vuelve a intentar.
      loading.delete(src);
      throw error;
    }
  );
  loading.set(src, promise);
  return promise;
};

/** La imagen si ya terminó de cargar (sin esperar). */
export const getLoadedImage = (src: string) => ready.get(src) ?? null;
