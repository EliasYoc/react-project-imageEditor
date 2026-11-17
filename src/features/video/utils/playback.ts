/**
 * Reproduce el video si está parado y lo pausa si está en marcha. Al final
 * del video, reproducir lo empieza de nuevo (lo hace el propio `<video>`).
 */
export const togglePlayback = (video: HTMLVideoElement) => {
  if (video.paused || video.ended) {
    // `play` falla si el navegador no deja reproducir (p. ej. sin un toque
    // del usuario): el video se queda en pausa, que es lo que se ve.
    void video.play().catch(() => {});
  } else {
    video.pause();
  }
};

/** Silencia el video o le devuelve el sonido. */
export const toggleMuted = (video: HTMLVideoElement) => {
  video.muted = !video.muted;
};

/**
 * Salta a otro momento del video, de uno en uno.
 *
 * Al arrastrar la barra de tiempo llegan muchos destinos seguidos, y cada
 * salto tarda (hay que decodificar el fotograma). Si el video aún está
 * saltando, el destino nuevo espera, y solo se pide el último: así no se
 * acumulan saltos a sitios por los que ya no se quiere pasar.
 */
export const createSeeker = (video: HTMLVideoElement) => {
  let pending: number | null = null;
  const flush = () => {
    if (pending === null) return;
    const time = pending;
    pending = null;
    video.currentTime = time;
  };
  video.addEventListener("seeked", flush);
  return {
    seek(time: number) {
      if (video.seeking) pending = time;
      else video.currentTime = time;
    },
    dispose() {
      video.removeEventListener("seeked", flush);
    },
  };
};
