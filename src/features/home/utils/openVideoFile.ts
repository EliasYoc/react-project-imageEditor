import type { Photo, Size, VideoSource } from "../../../editor/model/types";
import { releaseVideo } from "../../../editor/store/videoLifecycle";
import { fitVideoSize } from "../../../lib/videoSize";
import { baseName } from "./openImageFile";

/**
 * Duración máxima. El video exportado se arma entero en memoria (unos 47 MB
 * por minuto en Full HD): con más, un teléfono se queda sin memoria.
 */
export const MAX_VIDEO_SECONDS = 120;
/** Margen: un video "de 2 minutos" suele durar unas décimas más. */
const DURATION_MARGIN = 1;

/** Cuánto se espera a los datos del video antes de darlo por ilegible. */
const METADATA_TIMEOUT = 15_000;
/** Cuánto se espera al primer fotograma antes de forzarlo. */
const FIRST_FRAME_TIMEOUT = 4_000;

/** `readyState` a partir del cual hay un fotograma que pintar. */
const HAVE_CURRENT_DATA = 2;

const MESSAGES = {
  unreadable: "No se pudo abrir el video",
  tooLong: `El video dura más de ${MAX_VIDEO_SECONDS / 60} minutos`,
  unsupported: "Este navegador no puede exportar video",
} as const;

/** No se pudo abrir el video; `message` es el aviso para el usuario. */
export class VideoOpenError extends Error {
  reason: keyof typeof MESSAGES;

  constructor(reason: keyof typeof MESSAGES) {
    super(MESSAGES[reason]);
    this.name = "VideoOpenError";
    this.reason = reason;
  }
}

/** El archivo es un video. */
export const isVideoFile = (file: File | null | undefined): file is File =>
  !!file && file.type.startsWith("video/");

/**
 * Espera un evento del video: `true` si llega, `false` si pasa el tiempo.
 * Falla si el video da error (formato o códec que el navegador no abre).
 */
const waitForEvent = (video: HTMLVideoElement, type: string, timeout: number) =>
  new Promise<boolean>((resolve, reject) => {
    const finish = (settle: () => void) => {
      video.removeEventListener(type, onEvent);
      video.removeEventListener("error", onError);
      clearTimeout(timer);
      settle();
    };
    const onEvent = () => finish(() => resolve(true));
    const onError = () =>
      finish(() => reject(new VideoOpenError("unreadable")));
    const timer = setTimeout(() => finish(() => resolve(false)), timeout);
    video.addEventListener(type, onEvent);
    video.addEventListener("error", onError);
  });

/** Deja el video con su primer fotograma decodificado, listo para pintarlo. */
const ensureFirstFrame = async (video: HTMLVideoElement) => {
  const hasFrame = () => video.readyState >= HAVE_CURRENT_DATA;
  if (hasFrame()) return;
  if (await waitForEvent(video, "loadeddata", FIRST_FRAME_TIMEOUT)) return;
  // Algunos móviles no decodifican nada hasta que el video se reproduce: se
  // arranca (en silencio, que no necesita un toque del usuario) y se para.
  await video.play().catch(() => {});
  video.pause();
  video.currentTime = 0;
  if (hasFrame()) return;
  if (!(await waitForEvent(video, "loadeddata", FIRST_FRAME_TIMEOUT))) {
    throw new VideoOpenError("unreadable");
  }
};

/**
 * Lee un archivo de video y lo prepara como fondo del documento.
 *
 * El `<video>` lee el archivo por partes desde una URL de objeto (no se carga
 * entero en memoria) y queda en pausa en su primer fotograma. El documento
 * mide lo que el video, hasta Full HD: ese es también el tamaño al exportar.
 *
 * Falla con un `VideoOpenError` (con el aviso para el usuario) si el navegador
 * no puede abrirlo o exportarlo, o si es demasiado largo.
 */
export const openVideoFile = async (
  file: File
): Promise<Photo & { size: Size }> => {
  // Sin WebCodecs no se podría exportar: mejor avisar ahora que tras editar.
  if (typeof VideoEncoder === "undefined") {
    throw new VideoOpenError("unsupported");
  }

  const element = document.createElement("video");
  const url = URL.createObjectURL(file);
  const video: VideoSource = { element, file, url, duration: 0 };
  try {
    // En iOS, sin esto el video se abre en su reproductor a pantalla completa.
    element.playsInline = true;
    element.preload = "auto";
    element.muted = true;
    element.src = url;
    if (
      element.readyState < 1 &&
      !(await waitForEvent(element, "loadedmetadata", METADATA_TIMEOUT))
    ) {
      throw new VideoOpenError("unreadable");
    }

    // Un archivo con sonido que sí se entiende y una imagen que no, se abre
    // "solo con sonido": sin ancho. Las grabaciones sin cerrar no dan duración.
    const { videoWidth, videoHeight, duration } = element;
    const hasDuration = Number.isFinite(duration) && duration > 0;
    if (!videoWidth || !videoHeight || !hasDuration) {
      throw new VideoOpenError("unreadable");
    }
    if (duration > MAX_VIDEO_SECONDS + DURATION_MARGIN) {
      throw new VideoOpenError("tooLong");
    }

    await ensureFirstFrame(element);
    element.muted = false;

    return {
      source: null,
      preview: null,
      mimeType: null,
      fileName: baseName(file.name),
      video: { ...video, duration },
      // El documento mide lo que el video, que es también el tamaño al exportar.
      size: fitVideoSize({ width: videoWidth, height: videoHeight }),
    };
  } catch (error) {
    releaseVideo(video);
    throw error instanceof VideoOpenError
      ? error
      : new VideoOpenError("unreadable");
  }
};
