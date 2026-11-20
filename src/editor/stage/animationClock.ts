import type { VideoSource } from "../model/types";
import { onVideoFrame } from "./videoFrames";

/**
 * El tiempo de las imágenes animadas (GIFs), en segundos.
 *
 * - Con un video de fondo, el del video: los GIFs van a su ritmo, se paran
 *   en pausa y saltan con la barra de tiempo. Así el MP4 exportado muestra
 *   lo mismo que el lienzo.
 * - Si no, el reloj de la página. No hace falta saber cuándo empezó: cada
 *   GIF se repite por su cuenta.
 */
export const currentAnimationTime = (video: VideoSource | null) =>
  video ? video.element.currentTime : performance.now() / 1000;

/**
 * Llama a `onTick` con el tiempo cada vez que puede tocar otro fotograma: en
 * cada fotograma del video (y al saltar) o, sin video, en cada frame de la
 * pantalla. Devuelve la función para parar.
 */
export const onAnimationTick = (
  video: VideoSource | null,
  onTick: (seconds: number) => void
) => {
  const tick = () => onTick(currentAnimationTime(video));
  tick();
  if (video) return onVideoFrame(video.element, tick);

  let handle = requestAnimationFrame(function loop() {
    tick();
    handle = requestAnimationFrame(loop);
  });
  return () => cancelAnimationFrame(handle);
};
