import { vi } from "vitest";
import type { VideoSource } from "../editor/model/types";

export interface FakeVideoOptions {
  width?: number;
  height?: number;
  duration?: number;
  /** 0 = sin datos, 1 = con medidas y duración, 2 o más = hay un fotograma. */
  readyState?: number;
}

/** Lo que en un `<video>` de verdad solo cambia el navegador. */
type MediaState =
  | "videoWidth"
  | "videoHeight"
  | "duration"
  | "readyState"
  | "paused"
  | "ended"
  | "seeking";

/** Un `<video>` cuyo estado se puede cambiar a mano desde un test. */
export type FakeVideo = Omit<HTMLVideoElement, MediaState> & {
  -readonly [Key in MediaState]: HTMLVideoElement[Key];
};

/**
 * Un `<video>` de jsdom, que no reproduce ni decodifica nada, con lo que le
 * falta para los tests: medidas, duración, posición y estado que se pueden
 * cambiar a mano, y `play`, `pause` y `load` simulados (lanzan los mismos
 * eventos que un video de verdad).
 */
export const createFakeVideo = ({
  width = 640,
  height = 360,
  duration = 10,
  readyState = 4,
}: FakeVideoOptions = {}): FakeVideo => {
  const video = document.createElement("video");
  const state: Record<string, number | boolean> = {
    videoWidth: width,
    videoHeight: height,
    duration,
    readyState,
    currentTime: 0,
    paused: true,
    ended: false,
    seeking: false,
  };
  for (const key of Object.keys(state)) {
    Object.defineProperty(video, key, {
      configurable: true,
      get: () => state[key],
      set: (value: number | boolean) => {
        state[key] = value;
      },
    });
  }
  video.play = vi.fn(async () => {
    if (!state.paused) return;
    state.paused = false;
    state.ended = false;
    video.dispatchEvent(new Event("play"));
  });
  video.pause = vi.fn(() => {
    if (state.paused) return;
    state.paused = true;
    video.dispatchEvent(new Event("pause"));
  });
  video.load = vi.fn();
  return video;
};

/** Un video ya abierto, como lo deja `openVideoFile` en el documento. */
export const createFakeVideoSource = (
  options: FakeVideoOptions = {}
): VideoSource => {
  const element = createFakeVideo(options);
  return {
    element,
    file: new File(["x"], "clip.mp4", { type: "video/mp4" }),
    url: "blob:clip",
    duration: element.duration,
  };
};

/** jsdom no tiene URLs de objeto: se simulan y se devuelven para comprobarlas. */
export const mockObjectUrls = () => {
  const createObjectURL = vi.fn(() => "blob:clip");
  const revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  return { createObjectURL, revokeObjectURL };
};
