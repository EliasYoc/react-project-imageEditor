import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  frameIndexAt,
  frameSeconds,
  lottieFrameAt,
  wholeStepsIn,
} from "./animationTimeline";

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

describe("lottieFrameAt", () => {
  // 30 fps y 12 fotogramas: una vuelta de 0,4 s, como el sticker de prueba.
  const sticker = { fr: 30, ip: 0, op: 12 };

  it("da el fotograma de cada momento y se repite", () => {
    expect(lottieFrameAt(sticker, 0)).toBe(0);
    expect(lottieFrameAt(sticker, 0.1)).toBe(3);
    expect(lottieFrameAt(sticker, 0.5)).toBe(3);
    expect(lottieFrameAt(sticker, -0.1)).toBe(9);
  });

  it("en los cambios de fotograma y de vuelta no se queda en el anterior por el redondeo", () => {
    for (let index = 0; index < 450; index++) {
      const frame = lottieFrameAt(sticker, index / 30);
      expect(frame).toBe(index % 12);
    }
  });

  it("cuenta desde su primer fotograma (ip) y deja los intermedios con decimales", () => {
    // Del 10 al 70 a 60 fps: una vuelta de 1 s.
    const offset = { fr: 60, ip: 10, op: 70 };
    expect(lottieFrameAt(offset, 0.5)).toBe(30);
    expect(lottieFrameAt(offset, 1)).toBe(0);
    expect(lottieFrameAt({ fr: 24, ip: 0, op: 48 }, 0.1)).toBeCloseTo(2.4);
  });
});

describe("wholeStepsIn", () => {
  it("cuenta los pasos enteros aunque el redondeo deje 5,9999…", () => {
    expect(wholeStepsIn(0.2, 30)).toBe(6);
    expect(wholeStepsIn(0.19, 30)).toBe(5);
    for (let step = 0; step < 450; step++) {
      expect(wholeStepsIn(step / 30, 30)).toBe(step);
    }
  });
});
