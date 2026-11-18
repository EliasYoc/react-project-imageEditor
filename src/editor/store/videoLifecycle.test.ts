import { beforeEach, describe, expect, it } from "vitest";
import { createStroke } from "../model/factories";
import type { Photo, Size } from "../model/types";
import { createFakeVideoSource, mockObjectUrls } from "../../test/video";
import { createEditorStore } from "./editorStore";
import {
  selectBackgroundImage,
  selectHasBackground,
  selectHasDocumentContent,
  selectVideo,
} from "./selectors";

const SIZE = { width: 640, height: 360 };

const videoPhoto = (): Photo & { size: Size } => ({
  source: null,
  preview: null,
  mimeType: null,
  fileName: "clip",
  video: createFakeVideoSource(),
  size: SIZE,
});

const imagePhoto = (): Photo & { size: Size } => ({
  source: document.createElement("canvas"),
  preview: document.createElement("canvas"),
  mimeType: "image/png",
  fileName: "foto",
  video: null,
  size: SIZE,
});

const stroke = () => ({
  ...createStroke({
    brush: "pen",
    settings: { size: 10, opacity: 1, stabilizer: 0 },
    color: { r: 0, g: 0, b: 0, a: 1 },
  }),
  points: [{ x: 0, y: 0, pressure: 0.5 }],
});

let urls: ReturnType<typeof mockObjectUrls>;
let store: ReturnType<typeof createEditorStore>;
const state = () => store.getState();

beforeEach(() => {
  urls = mockObjectUrls();
  store = createEditorStore();
});

describe("video del documento", () => {
  it("un video abierto es el fondo del documento y cuenta como contenido", () => {
    expect(selectHasBackground(state())).toBe(false);
    expect(selectBackgroundImage(state())).toBeNull();

    const photo = videoPhoto();
    state().loadPhoto(photo);

    expect(state().canvasSize).toEqual(SIZE);
    expect(selectVideo(state())).toBe(photo.video);
    expect(selectHasBackground(state())).toBe(true);
    expect(selectBackgroundImage(state())).toBe(photo.video?.element);
    // Con solo el video ya hay algo que perder (p. ej. al recargar la app).
    expect(selectHasDocumentContent(state())).toBe(true);
  });

  it("con una foto, el fondo es su copia del tamaño del documento", () => {
    const photo = imagePhoto();
    state().loadPhoto(photo);
    expect(selectVideo(state())).toBeNull();
    expect(selectBackgroundImage(state())).toBe(photo.preview);
  });

  it("al empezar otro documento, el video anterior se suelta", () => {
    const { video } = videoPhoto();
    state().loadPhoto({ ...videoPhoto(), video });
    void video?.element.play();
    state().newDocument({ width: 100, height: 100 });

    expect(state().photo.video).toBeNull();
    expect(video?.element.paused).toBe(true);
    expect(video?.element.hasAttribute("src")).toBe(false);
    expect(video?.element.load).toHaveBeenCalled();
    expect(urls.revokeObjectURL).toHaveBeenCalledWith("blob:clip");
  });

  it("abrir una foto u otro video también suelta el anterior", () => {
    const first = videoPhoto();
    const second = videoPhoto();
    state().loadPhoto(first);
    state().loadPhoto(second);
    expect(first.video?.element.load).toHaveBeenCalled();
    expect(second.video?.element.load).not.toHaveBeenCalled();
    expect(urls.revokeObjectURL).toHaveBeenCalledTimes(1);

    state().loadPhoto(imagePhoto());
    expect(second.video?.element.load).toHaveBeenCalled();
    expect(urls.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("dibujar, deshacer y cambiar de modo no tocan el video", () => {
    const photo = videoPhoto();
    state().loadPhoto(photo);
    state().setMode("draw");
    state().addStroke(stroke());
    state().undo();
    state().redo();
    state().setMode("text");

    expect(state().photo.video).toBe(photo.video);
    expect(photo.video?.element.load).not.toHaveBeenCalled();
    expect(urls.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("al volver al inicio se pausa, sin soltarlo", () => {
    const photo = videoPhoto();
    state().loadPhoto(photo);
    state().setMode("draw");
    void photo.video?.element.play();
    expect(photo.video?.element.paused).toBe(false);

    state().setMode("home");
    expect(photo.video?.element.paused).toBe(true);
    expect(state().photo.video).toBe(photo.video);
    expect(urls.revokeObjectURL).not.toHaveBeenCalled();
  });
});
