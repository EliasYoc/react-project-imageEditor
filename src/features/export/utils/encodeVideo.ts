import {
  BlobSource,
  BufferTarget,
  CanvasSource,
  Conversion,
  ConversionCanceledError,
  getFirstEncodableVideoCodec,
  Input,
  MATROSKA,
  MP4,
  Mp4OutputFormat,
  Output,
  QTFF,
  QUALITY_HIGH,
  WEBM,
} from "mediabunny";
import type { Size } from "../../../editor/model/types";
import type { DrawBackground } from "./documentCompositor";

/*
 * El ÚNICO archivo que importa mediabunny. Se carga bajo demanda (ver
 * `exportVideo.ts`): así la biblioteca va en su propio trozo de JavaScript,
 * que solo se descarga al exportar un video. No lo reexportes desde un
 * `index.ts` ni lo importes de forma estática.
 */

export interface EncodeVideoOptions {
  /** El video original: se lee por partes, sin cargarlo entero en memoria. */
  file: File;
  /** Tamaño del video de salida (lados pares: lo exige H.264). */
  size: Size;
  /**
   * Compone un fotograma: `drawBackground` pinta el fotograma original y el
   * resultado lleva encima el resto del documento, con los GIFs en el
   * fotograma del segundo `seconds` del video.
   */
  renderFrame: (
    drawBackground: DrawBackground,
    seconds: number
  ) => Promise<CanvasImageSource>;
  /** Avance de 0 a 1. */
  onProgress: (progress: number) => void;
  /** Al abortarla, la exportación se cancela. */
  signal: AbortSignal;
}

export type EncodeVideoResult =
  /** `hasLostSound`: el video tenía sonido y no se pudo conservar. */
  | { status: "done"; blob: Blob; hasLostSound: boolean }
  | { status: "canceled" }
  /** El navegador no puede decodificar este video o codificar el MP4. */
  | { status: "unsupported" };

/**
 * Vuelve a codificar el video en MP4, pasando cada fotograma por
 * `renderFrame` (que le pone el dibujo encima).
 *
 * mediabunny lee el archivo, decodifica y codifica con WebCodecs (el
 * codificador del propio navegador, normalmente por hardware) y escribe el
 * MP4. Va tan rápido como el equipo pueda, no a la velocidad del video, y
 * pasa por TODOS los fotogramas, con sus tiempos originales.
 *
 * - **Sonido:** se copia tal cual cuando el MP4 admite su códec (AAC, el de
 *   casi todos los teléfonos); si no, se vuelve a codificar.
 * - **Giro:** los videos de teléfono suelen guardarse tumbados, con una nota
 *   de "girar 90°". Aquí cada fotograma llega ya derecho y la salida no lleva
 *   esa nota (`allowTransformationMetadata: false`).
 * - **Formato:** H.264 si el navegador puede codificarlo; si no, otro códec
 *   que quepa en un MP4 (lo elige mediabunny).
 * - **Memoria:** el MP4 se arma entero en memoria (`BufferTarget`); por eso
 *   hay un límite de duración al abrir el video.
 */
export const encodeVideo = async ({
  file,
  size,
  renderFrame,
  onProgress,
  signal,
}: EncodeVideoOptions): Promise<EncodeVideoResult> => {
  const input = new Input({
    source: new BlobSource(file),
    // Solo los formatos de los videos habituales: MP4, MOV, WebM y MKV.
    formats: [MP4, QTFF, WEBM, MATROSKA],
  });
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat(), target });

  const conversion = await Conversion.init({
    input,
    output,
    // La imagen y el sonido principales (un MP4 normal no lleva más).
    tracks: "primary",
    video: {
      allowTransformationMetadata: false,
      processedWidth: size.width,
      processedHeight: size.height,
      process: (sample) =>
        renderFrame(
          (ctx, { width, height }) => sample.draw(ctx, 0, 0, width, height),
          sample.timestamp
        ),
    },
    // Lo que no se pueda convertir se comprueba justo debajo.
    showWarnings: false,
  });

  const discarded = conversion.discardedTracks.map(({ track }) => track);
  if (!conversion.isValid || discarded.some((track) => track.isVideoTrack())) {
    return { status: "unsupported" };
  }
  if (signal.aborted) return { status: "canceled" };

  conversion.onProgress = onProgress;
  const cancel = () => void conversion.cancel();
  signal.addEventListener("abort", cancel);
  try {
    await conversion.execute();
  } catch (error) {
    if (error instanceof ConversionCanceledError) return { status: "canceled" };
    throw error;
  } finally {
    signal.removeEventListener("abort", cancel);
  }

  if (!target.buffer) throw new Error("La exportación no dejó ningún archivo");
  return {
    status: "done",
    blob: new Blob([target.buffer], { type: "video/mp4" }),
    hasLostSound: discarded.some((track) => track.isAudioTrack()),
  };
};

export interface EncodeFramesOptions {
  /** Tamaño del video (lados pares: lo exige H.264). */
  size: Size;
  /** Duración, en segundos. */
  duration: number;
  /** Fotogramas por segundo. */
  frameRate: number;
  /**
   * Compone el fotograma del segundo `seconds`. Devuelve SIEMPRE el mismo
   * canvas, del tamaño `size`: es lo que lee `CanvasSource`.
   */
  renderFrame: (seconds: number) => Promise<HTMLCanvasElement>;
  /** Avance de 0 a 1. */
  onProgress: (progress: number) => void;
  /** Al abortarla, la exportación se cancela. */
  signal: AbortSignal;
}

/**
 * Crea un MP4 sin sonido con los fotogramas que compone `renderFrame`: el
 * video de un lienzo o una foto con GIFs. Como `encodeVideo`, va tan rápido
 * como el equipo pueda y el MP4 se arma en memoria.
 *
 * El códec es el primero que el navegador sepa codificar en un MP4 a ese
 * tamaño (normalmente H.264).
 */
export const encodeFrames = async ({
  size,
  duration,
  frameRate,
  renderFrame,
  onProgress,
  signal,
}: EncodeFramesOptions): Promise<EncodeVideoResult> => {
  const format = new Mp4OutputFormat();
  const codec = await getFirstEncodableVideoCodec(
    format.getSupportedVideoCodecs(),
    { ...size, quality: QUALITY_HIGH }
  );
  if (!codec) return { status: "unsupported" };

  const target = new BufferTarget();
  const output = new Output({ format, target });
  const frameCount = Math.round(duration * frameRate);
  // `CanvasSource` necesita el canvas al crearse: llega con el primer fotograma.
  let source: CanvasSource | null = null;
  try {
    for (let index = 0; index < frameCount; index++) {
      if (signal.aborted) {
        await output.cancel();
        return { status: "canceled" };
      }
      const seconds = index / frameRate;
      const canvas = await renderFrame(seconds);
      if (!source) {
        source = new CanvasSource(canvas, { codec, quality: QUALITY_HIGH });
        output.addVideoTrack(source, { frameRate });
        await output.start();
      }
      await source.add(seconds, 1 / frameRate);
      onProgress((index + 1) / frameCount);
    }
    await output.finalize();
  } catch (error) {
    // Se suelta el codificador; el error que importa es el primero.
    await output.cancel().catch(() => {});
    throw error;
  }

  if (!target.buffer) throw new Error("La exportación no dejó ningún archivo");
  return {
    status: "done",
    blob: new Blob([target.buffer], { type: "video/mp4" }),
    hasLostSound: false,
  };
};
