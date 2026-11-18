import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  editorStore,
} from "../../../editor/store/editorStore";
import { createFakeVideoSource, mockObjectUrls } from "../../../test/video";
import { createDocumentCompositor } from "./documentCompositor";
import { encodeVideo } from "./encodeVideo";
import { exportVideo } from "./exportVideo";

// El codificador de verdad necesita WebCodecs, que jsdom no tiene.
vi.mock("./encodeVideo", () => ({ encodeVideo: vi.fn() }));
vi.mock("./documentCompositor", () => ({
  createDocumentCompositor: vi.fn(),
}));

const SIZE = { width: 1280, height: 720 };
const render = vi.fn();
const done = {
  status: "done",
  blob: new Blob(["video"], { type: "video/mp4" }),
  hasLostSound: false,
} as const;

const openVideo = () => {
  const video = createFakeVideoSource();
  editorStore.setState({
    ...createInitialState(),
    mode: "draw",
    canvasSize: SIZE,
    photo: {
      source: null,
      preview: null,
      mimeType: null,
      fileName: "clip",
      video,
    },
  });
  return video;
};

beforeEach(() => {
  mockObjectUrls();
  editorStore.setState(createInitialState());
  vi.mocked(createDocumentCompositor).mockReset();
  vi.mocked(createDocumentCompositor).mockResolvedValue({ render });
  vi.mocked(encodeVideo).mockReset();
  vi.mocked(encodeVideo).mockResolvedValue(done);
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "wakeLock");
});

describe("exportVideo", () => {
  it("codifica el archivo original al tamaño del documento, componiendo cada fotograma", async () => {
    const video = openVideo();
    const onProgress = vi.fn();
    const { signal } = new AbortController();

    expect(await exportVideo({ onProgress, signal })).toBe(done);
    expect(vi.mocked(createDocumentCompositor).mock.calls[0][1]).toEqual(SIZE);
    expect(encodeVideo).toHaveBeenCalledWith({
      file: video.file,
      size: SIZE,
      renderFrame: render,
      onProgress,
      signal,
    });
  });

  it("pausa el video del lienzo antes de exportar", async () => {
    const video = openVideo();
    void video.element.play();
    await exportVideo({
      onProgress: vi.fn(),
      signal: new AbortController().signal,
    });
    expect(video.element.paused).toBe(true);
  });

  it("mantiene la pantalla encendida mientras exporta, y la suelta al acabar", async () => {
    openVideo();
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release });
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request },
    });
    vi.mocked(encodeVideo).mockImplementation(async () => {
      expect(request).toHaveBeenCalledWith("screen");
      expect(release).not.toHaveBeenCalled();
      return done;
    });

    await exportVideo({
      onProgress: vi.fn(),
      signal: new AbortController().signal,
    });
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("si el sistema no deja mantener la pantalla encendida, exporta igual", async () => {
    openVideo();
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: vi.fn().mockRejectedValue(new Error("batería")) },
    });
    const result = await exportVideo({
      onProgress: vi.fn(),
      signal: new AbortController().signal,
    });
    expect(result).toBe(done);
  });

  it("suelta la pantalla aunque la exportación falle", async () => {
    openVideo();
    const release = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: vi.fn().mockResolvedValue({ release }) },
    });
    vi.mocked(encodeVideo).mockRejectedValue(new Error("sin memoria"));
    await expect(
      exportVideo({ onProgress: vi.fn(), signal: new AbortController().signal })
    ).rejects.toThrow("sin memoria");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("sin un video abierto, falla", async () => {
    await expect(
      exportVideo({ onProgress: vi.fn(), signal: new AbortController().signal })
    ).rejects.toThrow("No hay un video abierto");
    expect(encodeVideo).not.toHaveBeenCalled();
  });
});
