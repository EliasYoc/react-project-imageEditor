import { editorStore } from "../../../editor/store/editorStore";
import { selectVideo } from "../../../editor/store/selectors";
import { createCanvas, get2dContext } from "../../../lib/canvas";
import { fitVideoSize } from "../../../lib/videoSize";
import {
  ANIMATION_FRAME_RATE,
  ANIMATION_VIDEO_SECONDS,
} from "../constants/animationVideo";
import {
  createDocumentCompositor,
  drawStillBackground,
} from "./documentCompositor";
import type { EncodeVideoResult } from "./encodeVideo";

export interface ExportVideoOptions {
  /** Avance de 0 a 1. */
  onProgress: (progress: number) => void;
  /** Al abortarla, la exportación se cancela. */
  signal: AbortSignal;
}

/**
 * Mantiene la pantalla encendida mientras dura `task`: si el teléfono se
 * bloquea a media exportación, el navegador la detiene. Donde no existe esta
 * función, o el sistema la niega (p. ej. con poca batería), se sigue sin ella.
 */
const withScreenAwake = async <T>(task: () => Promise<T>) => {
  const lock = await navigator.wakeLock?.request("screen").catch(() => null);
  try {
    return await task();
  } finally {
    void lock?.release().catch(() => {});
  }
};

/**
 * Exporta el video del documento con todo lo dibujado encima, en MP4.
 *
 * El documento se compone igual que al exportar una imagen
 * (`createDocumentCompositor`): lo fijo (trazos, textos, imágenes, capa de
 * color) se pinta una vez, y en cada fotograma solo se repite lo que depende
 * del fondo y, si hay GIFs, los elementos, con el fotograma de ese momento
 * del video. El tamaño es el del documento, que se fijó al abrir el video.
 *
 * El codificador (`encodeVideo`, con mediabunny) se descarga aquí, la primera
 * vez que se exporta un video.
 */
export const exportVideo = async ({
  onProgress,
  signal,
}: ExportVideoOptions): Promise<EncodeVideoResult> => {
  const state = editorStore.getState();
  const video = selectVideo(state);
  if (!video) throw new Error("No hay un video abierto");
  // El video del lienzo no se usa para exportar (se lee el archivo), pero no
  // tiene sentido que siga sonando mientras tanto.
  video.element.pause();

  const size = state.canvasSize;
  const [compositor, { encodeVideo }] = await Promise.all([
    createDocumentCompositor(state, size),
    import("./encodeVideo"),
  ]);
  try {
    return await withScreenAwake(() =>
      encodeVideo({
        file: video.file,
        size,
        renderFrame: compositor.render,
        onProgress,
        signal,
      })
    );
  } finally {
    compositor.dispose();
  }
};

/**
 * Exporta un lienzo o una foto con GIFs como video: un MP4 sin sonido de
 * `ANIMATION_VIDEO_SECONDS` segundos con los GIFs moviéndose. Mide lo que el
 * documento, reducido a Full HD si es mayor.
 */
export const exportAnimation = async ({
  onProgress,
  signal,
}: ExportVideoOptions): Promise<EncodeVideoResult> => {
  const state = editorStore.getState();
  const size = fitVideoSize(state.canvasSize);
  // El fondo no cambia: se escala una vez al tamaño del video (reducir una
  // foto grande en cada fotograma costaría mucho).
  const background = createCanvas(size);
  drawStillBackground(state.photo.source)(get2dContext(background), size);

  const [compositor, { encodeFrames }] = await Promise.all([
    createDocumentCompositor(state, size),
    import("./encodeVideo"),
  ]);
  try {
    return await withScreenAwake(() =>
      encodeFrames({
        size,
        duration: ANIMATION_VIDEO_SECONDS,
        frameRate: ANIMATION_FRAME_RATE,
        renderFrame: (seconds) =>
          compositor.render(drawStillBackground(background), seconds),
        onProgress,
        signal,
      })
    );
  } finally {
    compositor.dispose();
  }
};
