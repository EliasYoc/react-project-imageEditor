import { createCanvas, get2dContext } from "../../lib/canvas";
import { buildTimeline, frameIndexAt, frameSeconds } from "./animationTimeline";

/**
 * El navegador sabe decodificar una imagen animada fotograma a fotograma
 * (`ImageDecoder`, de WebCodecs). Safari no lo tiene: allí un GIF se pinta
 * como una imagen normal, quieta en su primer fotograma.
 */
export const canAnimateImages = () => typeof ImageDecoder !== "undefined";

/** Lee la imagen entera en un decodificador (con todos sus fotogramas). */
const openDecoder = async (image: Blob) => {
  const decoder = new ImageDecoder({ data: image.stream(), type: image.type });
  await decoder.tracks.ready;
  await decoder.completed;
  return decoder;
};

/**
 * La imagen tiene varios fotogramas y este navegador puede animarla. Se
 * mira una vez, al insertarla. Falla si el archivo está dañado.
 */
export const isAnimatedImage = async (file: Blob) => {
  if (!canAnimateImages() || !(await ImageDecoder.isTypeSupported(file.type))) {
    return false;
  }
  const decoder = await openDecoder(file);
  try {
    const track = decoder.tracks.selectedTrack;
    return Boolean(track?.animated && track.frameCount > 1);
  } finally {
    decoder.close();
  }
};

/** Una imagen animada del lienzo, que pinta su fotograma actual en un canvas. */
export interface AnimatedImage {
  /** Del tamaño de la imagen, con el fotograma que toca: es lo que pinta Konva. */
  readonly canvas: HTMLCanvasElement;
  /** Pide el fotograma del segundo `seconds`; se pinta en cuanto se decodifica. */
  showFrameAt: (seconds: number) => void;
  /** Avisa cada vez que el canvas cambia de fotograma. Devuelve cómo parar. */
  onFrame: (listener: () => void) => () => void;
}

/**
 * Abre la imagen animada de `src` (una URL blob:).
 *
 * Para no gastar memoria, nunca se guardan todos los fotogramas abiertos: un
 * GIF de 480 × 270 con 50 fotogramas ocuparía unos 26 MB. Se guarda el
 * archivo comprimido (dentro del decodificador) y un solo canvas; cada
 * fotograma se decodifica al necesitarlo y se suelta después de pintarlo.
 */
const createAnimatedImage = async (src: string): Promise<AnimatedImage> => {
  const decoder = await openDecoder(await (await fetch(src)).blob());
  const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;

  // Lo que dura cada fotograma solo se sabe al decodificarlo: se recorren
  // todos una vez. El primero se queda pintado en el canvas.
  const durations: number[] = [];
  let firstFrame: HTMLCanvasElement | null = null;
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const { image } = await decoder.decode({ frameIndex });
    durations.push(frameSeconds(image.duration));
    if (!firstFrame) {
      firstFrame = createCanvas({
        width: image.displayWidth,
        height: image.displayHeight,
      });
      get2dContext(firstFrame).drawImage(image, 0, 0);
    }
    image.close();
  }
  if (!firstFrame) throw new Error("La imagen animada no tiene fotogramas");

  const canvas = firstFrame;
  const ctx = get2dContext(canvas);
  const timeline = buildTimeline(durations);
  const listeners = new Set<() => void>();
  let shownIndex = 0;
  let wantedIndex = 0;
  let isDecoding = false;
  let hasFailed = false;

  /**
   * Decodifica hasta mostrar el último fotograma pedido. Si se piden varios
   * mientras uno se decodifica, solo se pinta el último (los de en medio ya
   * no hacen falta).
   */
  const decodeWantedFrames = async () => {
    isDecoding = true;
    try {
      while (wantedIndex !== shownIndex) {
        const frameIndex = wantedIndex;
        const { image } = await decoder.decode({ frameIndex });
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);
        } finally {
          image.close();
        }
        shownIndex = frameIndex;
        for (const listener of listeners) listener();
      }
    } catch (error) {
      // Se queda en el último fotograma que pudo pintar, sin repetir el
      // error en cada frame de la pantalla.
      hasFailed = true;
      console.error(error);
    } finally {
      isDecoding = false;
    }
  };

  return {
    canvas,
    showFrameAt: (seconds) => {
      if (hasFailed) return;
      wantedIndex = frameIndexAt(timeline, seconds);
      if (!isDecoding && wantedIndex !== shownIndex) void decodeWantedFrames();
    },
    onFrame: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

// Una por `src`, como `imageCache`: dos elementos con el mismo GIF comparten
// el decodificador y el canvas (los dos van al mismo tiempo).
const loading = new Map<string, Promise<AnimatedImage>>();
const ready = new Map<string, AnimatedImage>();

/** Abre la imagen animada de `src` una sola vez. */
export const loadAnimatedImage = (src: string): Promise<AnimatedImage> => {
  const cached = loading.get(src);
  if (cached) return cached;
  const promise = createAnimatedImage(src).then(
    (animation) => {
      ready.set(src, animation);
      return animation;
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

/** La imagen animada si ya está abierta (sin esperar). */
export const getLoadedAnimatedImage = (src: string) => ready.get(src) ?? null;
