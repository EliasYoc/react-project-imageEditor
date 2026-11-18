import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakeVideo, type FakeVideo } from "../../test/video";
import { onVideoFrame } from "./videoFrames";

/** Le pone al video un `requestVideoFrameCallback` que se dispara a mano. */
const withFrameCallback = (video: FakeVideo) => {
  const pending = new Map<number, () => void>();
  let nextHandle = 1;
  video.requestVideoFrameCallback = vi.fn((callback: () => void) => {
    pending.set(nextHandle, callback);
    return nextHandle++;
  }) as unknown as HTMLVideoElement["requestVideoFrameCallback"];
  video.cancelVideoFrameCallback = vi.fn((handle: number) => {
    pending.delete(handle);
  });
  return {
    pending,
    /** El navegador presenta un fotograma nuevo. */
    presentFrame: () => {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback();
    },
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("onVideoFrame", () => {
  it("avisa en cada fotograma nuevo y sigue escuchando el siguiente", () => {
    const video = createFakeVideo();
    const frames = withFrameCallback(video);
    const onFrame = vi.fn();
    onVideoFrame(video, onFrame);

    expect(onFrame).not.toHaveBeenCalled();
    frames.presentFrame();
    frames.presentFrame();
    frames.presentFrame();
    expect(onFrame).toHaveBeenCalledTimes(3);
    expect(frames.pending.size).toBe(1);
  });

  it("avisa también al saltar a otro momento, aunque esté en pausa", () => {
    const video = createFakeVideo();
    withFrameCallback(video);
    const onFrame = vi.fn();
    onVideoFrame(video, onFrame);

    video.dispatchEvent(new Event("seeked"));
    expect(onFrame).toHaveBeenCalledTimes(1);
  });

  it("al dejar de escuchar no avisa más ni deja nada pendiente", () => {
    const video = createFakeVideo();
    const frames = withFrameCallback(video);
    const onFrame = vi.fn();
    const stop = onVideoFrame(video, onFrame);
    stop();

    expect(frames.pending.size).toBe(0);
    frames.presentFrame();
    video.dispatchEvent(new Event("seeked"));
    expect(onFrame).not.toHaveBeenCalled();
  });

  it("sin requestVideoFrameCallback usa los frames de la pantalla, solo mientras se reproduce", async () => {
    const pending: (() => void)[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) =>
      pending.push(callback)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const nextFrame = () => pending.splice(0).forEach((callback) => callback());

    const video = createFakeVideo();
    const onFrame = vi.fn();
    onVideoFrame(video, onFrame);
    // En pausa no hay bucle.
    expect(pending).toHaveLength(0);

    await video.play();
    nextFrame();
    nextFrame();
    expect(onFrame).toHaveBeenCalledTimes(2);

    // Al pausar, el frame pendiente avisa por última vez y el bucle se para.
    video.pause();
    nextFrame();
    expect(pending).toHaveLength(0);
    expect(onFrame).toHaveBeenCalledTimes(3);

    await video.play();
    nextFrame();
    expect(onFrame).toHaveBeenCalledTimes(4);
  });
});
