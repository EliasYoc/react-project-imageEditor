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
 *
 * El estado se lee del `<video>` SOLO cuando avisa (evento o fotograma), no
 * en `getSnapshot`. En muchos móviles `currentTime` avanza entre dos lecturas
 * seguidas mientras el video se reproduce. React vuelve a llamar a
 * `getSnapshot` tras pintar para comprobar que nada cambió: si cada llamada
 * diera un tiempo nuevo, volvería a pintar sin fin y la app se caería
 * ("Maximum update depth exceeded").
 */
const createPlaybackSource = (video: HTMLVideoElement) => {
  let snapshot = read(video);
  /** Lee el video; mientras no cambie nada se queda el mismo objeto (React
   * compara por referencia para saber si tiene que volver a pintar). */
  const refresh = () => {
    const next = read(video);
    if (KEYS.some((key) => !Object.is(next[key], snapshot[key]))) {
      snapshot = next;
    }
  };
  return {
    subscribe: (notify: () => void) => {
      const onChange = () => {
        refresh();
        notify();
      };
      // Pudo cambiar algo entre crear la fuente y suscribirse.
      onChange();
      for (const type of EVENTS) video.addEventListener(type, onChange);
      const stopFrames = onVideoFrame(video, onChange);
      return () => {
        for (const type of EVENTS) video.removeEventListener(type, onChange);
        stopFrames();
      };
    },
    getSnapshot: () => snapshot,
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
