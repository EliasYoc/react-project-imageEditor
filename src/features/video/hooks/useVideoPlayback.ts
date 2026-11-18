import { useMemo, useSyncExternalStore } from "react";
import { onVideoFrame } from "../../../editor/stage/videoFrames";

/** Lo que la barra de reproducción muestra del video. */
export interface Playback {
  isPlaying: boolean;
  /** Posición actual, en segundos. */
  currentTime: number;
  /** Duración, en segundos. */
  duration: number;
  isMuted: boolean;
}

/** Los eventos con los que el `<video>` avisa de que cambió algo de eso. */
const EVENTS = [
  "play",
  "pause",
  "ended",
  "timeupdate",
  "seeking",
  "seeked",
  "durationchange",
  "volumechange",
] as const;

const KEYS = ["isPlaying", "currentTime", "duration", "isMuted"] as const;

const read = (video: HTMLVideoElement): Playback => ({
  isPlaying: !video.paused && !video.ended,
  currentTime: video.currentTime,
  duration: video.duration,
  isMuted: video.muted,
});

/**
 * El `<video>` como fuente externa para React (`useSyncExternalStore`): cómo
 * suscribirse a sus cambios y cómo leer su estado.
 *
 * Además de sus eventos se escucha cada fotograma nuevo, para que la barra de
 * tiempo avance suave (`timeupdate` solo salta unas 4 veces por segundo).
 */
const createPlaybackSource = (video: HTMLVideoElement) => {
  let snapshot = read(video);
  return {
    subscribe: (notify: () => void) => {
      for (const type of EVENTS) video.addEventListener(type, notify);
      const stopFrames = onVideoFrame(video, notify);
      return () => {
        for (const type of EVENTS) video.removeEventListener(type, notify);
        stopFrames();
      };
    },
    // Mientras no cambie nada devuelve el mismo objeto: React compara por
    // referencia para saber si tiene que volver a pintar.
    getSnapshot: () => {
      const next = read(video);
      if (KEYS.some((key) => !Object.is(next[key], snapshot[key]))) {
        snapshot = next;
      }
      return snapshot;
    },
  };
};

/**
 * El estado de reproducción del video, al día.
 *
 * El propio `<video>` es la única fuente de verdad: no hay un store con una
 * copia que pueda quedarse atrás.
 */
export const useVideoPlayback = (video: HTMLVideoElement): Playback => {
  const source = useMemo(() => createPlaybackSource(video), [video]);
  return useSyncExternalStore(source.subscribe, source.getSnapshot);
};
