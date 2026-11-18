/**
 * Avisa cada vez que el video tiene un fotograma nuevo que pintar:
 * - mientras se reproduce, una vez por fotograma del VIDEO (no por cada frame
 *   de la pantalla: un video de 30 fps en una pantalla de 60 Hz avisa 30
 *   veces por segundo). En pausa no avisa, así que no cuesta nada;
 * - al saltar a otro momento (también en pausa).
 *
 * Usa `requestVideoFrameCallback`, que es justo eso. Donde no existe, lo
 * sustituye por `requestAnimationFrame` mientras el video se reproduce.
 *
 * Devuelve la función para dejar de escuchar.
 */
export const onVideoFrame = (video: HTMLVideoElement, callback: () => void) => {
  const hasFrameCallback =
    typeof video.requestVideoFrameCallback === "function";
  let handle: number | null = null;
  let isStopped = false;

  const schedule = () => {
    if (hasFrameCallback) {
      handle = video.requestVideoFrameCallback(onFrame);
    } else if (!video.paused && !video.ended) {
      handle = requestAnimationFrame(onFrame);
    } else {
      handle = null;
    }
  };
  const onFrame = () => {
    if (isStopped) return;
    callback();
    schedule();
  };
  // Sin `requestVideoFrameCallback`, el bucle se para en pausa: se retoma aquí.
  const onPlay = () => {
    if (!hasFrameCallback && handle === null) schedule();
  };

  video.addEventListener("play", onPlay);
  video.addEventListener("seeked", callback);
  video.addEventListener("loadeddata", callback);
  schedule();

  return () => {
    isStopped = true;
    video.removeEventListener("play", onPlay);
    video.removeEventListener("seeked", callback);
    video.removeEventListener("loadeddata", callback);
    if (handle === null) return;
    if (hasFrameCallback) video.cancelVideoFrameCallback(handle);
    else cancelAnimationFrame(handle);
  };
};
