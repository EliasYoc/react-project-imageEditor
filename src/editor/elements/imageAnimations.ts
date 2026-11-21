import type { ImageAnimation } from "../model/types";
import { openFramesAnimation, type AnimatedImage } from "./animatedImage";

type MovingImage = Exclude<ImageAnimation, "none">;

/** Cómo se abre cada tipo de imagen que se mueve. */
const OPENERS: Record<MovingImage, (src: string) => Promise<AnimatedImage>> = {
  frames: openFramesAnimation,
  // lottie-web (unos 55 kB) se descarga solo con el primer sticker.
  lottie: async (src) =>
    (await import("./lottieSticker")).openLottieSticker(src),
};

// Una por `src`, como `imageCache`: los elementos con el mismo archivo la
// comparten (van al mismo tiempo), y 30 copias de un sticker se pintan una
// sola vez por fotograma.
const loading = new Map<string, Promise<AnimatedImage>>();
const ready = new Map<string, AnimatedImage>();

/** Abre la animación de la imagen de `src` una sola vez. */
export const loadImageAnimation = (
  src: string,
  animation: MovingImage
): Promise<AnimatedImage> => {
  const cached = loading.get(src);
  if (cached) return cached;
  const promise = OPENERS[animation](src).then(
    (opened) => {
      ready.set(src, opened);
      return opened;
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

/** La animación si ya está abierta (sin esperar). */
export const getLoadedImageAnimation = (src: string) => ready.get(src) ?? null;
