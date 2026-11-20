import { describe, expect, it } from "vitest";
import { buildTimeline, frameIndexAt, frameSeconds } from "./animationTimeline";

describe("frameSeconds", () => {
  it("pasa de microsegundos a segundos", () => {
    expect(frameSeconds(200_000)).toBe(0.2);
    expect(frameSeconds(20_000)).toBe(0.02);
  });

  it("muestra 100 ms los fotogramas de 10 ms o menos, o sin duración", () => {
    expect(frameSeconds(10_000)).toBe(0.1);
    expect(frameSeconds(0)).toBe(0.1);
    expect(frameSeconds(null)).toBe(0.1);
  });
});

describe("frameIndexAt", () => {
  // Tres fotogramas: 0,1 s + 0,2 s + 0,3 s = una vuelta de 0,6 s.
  const timeline = buildTimeline([0.1, 0.2, 0.3]);

  it("arma la vuelta con el inicio de cada fotograma", () => {
    expect(timeline.frameStarts).toEqual([0, 0.1, expect.closeTo(0.3)]);
    expect(timeline.loopDuration).toBeCloseTo(0.6);
  });

  it("da el fotograma que se ve en cada momento de la vuelta", () => {
    expect(frameIndexAt(timeline, 0)).toBe(0);
    expect(frameIndexAt(timeline, 0.05)).toBe(0);
    expect(frameIndexAt(timeline, 0.1)).toBe(1);
    expect(frameIndexAt(timeline, 0.29)).toBe(1);
    expect(frameIndexAt(timeline, 0.31)).toBe(2);
    expect(frameIndexAt(timeline, 0.59)).toBe(2);
  });

  it("se repite sin fin, también con tiempos negativos", () => {
    expect(frameIndexAt(timeline, 0.65)).toBe(0);
    expect(frameIndexAt(timeline, 6.15)).toBe(1);
    expect(frameIndexAt(timeline, -0.05)).toBe(2);
  });

  it("justo en el cambio de fotograma ya sale el nuevo, aunque los decimales redondeen", () => {
    // Dos fotogramas de 0,2 s: 0,6 % 0,4 da 0,1999… en lugar de 0,2.
    const twoFrames = buildTimeline([0.2, 0.2]);
    expect(frameIndexAt(twoFrames, 0.6)).toBe(1);
    expect(frameIndexAt(twoFrames, 1.0)).toBe(1);
    expect(frameIndexAt(twoFrames, 18 / 30)).toBe(1);
    expect(frameIndexAt(twoFrames, 0.8)).toBe(0);
  });

  it("justo al final de una vuelta ya sale el primer fotograma", () => {
    // 1,2 % 0,4 da 0,3999… en lugar de 0.
    const twoFrames = buildTimeline([0.2, 0.2]);
    expect(frameIndexAt(twoFrames, 1.2)).toBe(0);
    expect(frameIndexAt(twoFrames, 36 / 30)).toBe(0);
    expect(frameIndexAt(twoFrames, 2)).toBe(0);
    expect(frameIndexAt(twoFrames, 1.19)).toBe(1);
  });

  it("con un solo fotograma siempre es el primero", () => {
    expect(frameIndexAt(buildTimeline([0.5]), 12.3)).toBe(0);
    expect(frameIndexAt(buildTimeline([]), 1)).toBe(0);
  });
});
