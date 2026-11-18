import type { Mode, Photo, VideoSource } from "../model/types";

/**
 * Suelta un video que ya no se usa: deja de reproducirse, el navegador
 * descarta lo que tenía decodificado y se libera la URL de su archivo.
 */
export const releaseVideo = ({ element, url }: VideoSource) => {
  element.pause();
  element.removeAttribute("src");
  element.load();
  URL.revokeObjectURL(url);
};

interface VideoState {
  mode: Mode;
  photo: Photo;
}

interface VideoStateStore {
  subscribe: (
    listener: (state: VideoState, previous: VideoState) => void
  ) => () => void;
}

/**
 * Cuida del video del documento, que es un `<video>` fuera de React y del
 * historial:
 * - al cambiar de documento (otra foto, otro video, un lienzo en blanco), el
 *   video anterior se suelta;
 * - al volver al inicio se pausa: el editor sigue montado pero oculto, y no
 *   debe seguir sonando.
 */
export const watchVideo = (store: VideoStateStore) =>
  store.subscribe((state, previous) => {
    const before = previous.photo.video;
    if (before && before !== state.photo.video) releaseVideo(before);
    if (state.mode === "home" && previous.mode !== "home") {
      state.photo.video?.element.pause();
    }
  });
