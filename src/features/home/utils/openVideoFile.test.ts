import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFakeVideo,
  mockObjectUrls,
  type FakeVideoOptions,
} from "../../../test/video";
import {
  isVideoFile,
  openVideoFile,
  videoDocumentSize,
  VideoOpenError,
} from "./openVideoFile";

const file = new File(["x"], "playa.mp4", { type: "video/mp4" });

/** Hace que el próximo `<video>` que cree el código sea uno simulado. */
const nextVideo = (options?: FakeVideoOptions) => {
  const video = createFakeVideo(options);
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(
    (tag: string, ...rest: []) =>
      tag === "video" ? video : createElement(tag, ...rest)
  );
  return video;
};

let urls: ReturnType<typeof mockObjectUrls>;

beforeEach(() => {
  urls = mockObjectUrls();
  vi.stubGlobal("VideoEncoder", class {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("abrir un video", () => {
  it("solo acepta videos", () => {
    expect(isVideoFile(file)).toBe(true);
    expect(isVideoFile(new File([""], "a.png", { type: "image/png" }))).toBe(
      false
    );
    expect(isVideoFile(null)).toBe(false);
  });

  it("el documento mide lo que el video, hasta Full HD y con lados pares", () => {
    expect(videoDocumentSize({ width: 1280, height: 720 })).toEqual({
      width: 1280,
      height: 720,
    });
    expect(videoDocumentSize({ width: 3840, height: 2160 })).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(videoDocumentSize({ width: 2160, height: 3840 })).toEqual({
      width: 1080,
      height: 1920,
    });
    expect(videoDocumentSize({ width: 853, height: 481 })).toEqual({
      width: 854,
      height: 482,
    });
  });

  it("lo prepara como fondo del documento, en pausa y con sonido", async () => {
    const video = nextVideo({ width: 1280, height: 720, duration: 12.5 });
    const photo = await openVideoFile(file);

    expect(photo).toMatchObject({
      source: null,
      preview: null,
      fileName: "playa",
      size: { width: 1280, height: 720 },
      video: { element: video, file, url: "blob:clip", duration: 12.5 },
    });
    expect(urls.createObjectURL).toHaveBeenCalledWith(file);
    expect(video.getAttribute("src")).toBe("blob:clip");
    // Sin `playsInline`, iOS lo abriría a pantalla completa.
    expect(video.playsInline).toBe(true);
    expect(video.muted).toBe(false);
    expect(video.paused).toBe(true);
    expect(urls.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("espera a que lleguen los datos y el primer fotograma", async () => {
    const video = nextVideo({ readyState: 0 });
    let opened = false;
    const opening = openVideoFile(file).then((photo) => {
      opened = true;
      return photo;
    });

    video.readyState = 1;
    video.dispatchEvent(new Event("loadedmetadata"));
    await Promise.resolve();
    expect(opened).toBe(false);

    video.readyState = 2;
    video.dispatchEvent(new Event("loadeddata"));
    expect((await opening).video?.element).toBe(video);
  });

  it("si el primer fotograma no llega, lo fuerza reproduciendo en silencio", async () => {
    vi.useFakeTimers();
    const video = nextVideo({ readyState: 1 });
    vi.mocked(video.play).mockImplementation(async () => {
      expect(video.muted).toBe(true);
      video.readyState = 2;
    });
    const opening = openVideoFile(file);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(opening).resolves.toMatchObject({ fileName: "playa" });
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(video.pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
    expect(video.muted).toBe(false);
  });

  it("si el navegador no puede abrirlo, falla y libera el archivo", async () => {
    const video = nextVideo({ readyState: 0 });
    const opening = openVideoFile(file);
    video.dispatchEvent(new Event("error"));

    await expect(opening).rejects.toThrow("No se pudo abrir el video");
    await expect(opening).rejects.toBeInstanceOf(VideoOpenError);
    expect(urls.revokeObjectURL).toHaveBeenCalledWith("blob:clip");
    expect(video.hasAttribute("src")).toBe(false);
    expect(video.load).toHaveBeenCalled();
  });

  it("un archivo sin imagen (solo sonido) o sin duración no se abre", async () => {
    nextVideo({ width: 0, height: 0 });
    await expect(openVideoFile(file)).rejects.toThrow(
      "No se pudo abrir el video"
    );
    vi.restoreAllMocks();
    nextVideo({ duration: Infinity });
    await expect(openVideoFile(file)).rejects.toThrow(
      "No se pudo abrir el video"
    );
  });

  it("un video demasiado largo se rechaza con su aviso", async () => {
    nextVideo({ duration: 121.5 });
    await expect(openVideoFile(file)).rejects.toThrow(
      "El video dura más de 2 minutos"
    );
    expect(urls.revokeObjectURL).toHaveBeenCalledWith("blob:clip");
    vi.restoreAllMocks();
    // Las décimas de más de un video "de 2 minutos" no cuentan.
    nextVideo({ duration: 120.4 });
    await expect(openVideoFile(file)).resolves.toBeDefined();
  });

  it("sin WebCodecs avisa al abrir de que no se podrá exportar", async () => {
    vi.unstubAllGlobals();
    await expect(openVideoFile(file)).rejects.toThrow(
      "Este navegador no puede exportar video"
    );
    expect(urls.createObjectURL).not.toHaveBeenCalled();
  });
});
