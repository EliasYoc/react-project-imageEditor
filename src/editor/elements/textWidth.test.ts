import type { Text as KonvaText } from "konva/lib/shapes/Text";
import { describe, expect, it } from "vitest";
import { applyTextMaxWidth, maxTextWidth } from "./textWidth";

/**
 * Un nodo Text simulado: `width("auto")` vuelve a medir el contenido y
 * `width(n)` lo fija, como en Konva.
 */
const fakeText = (contentWidth: number) => {
  let fixed: number | "auto" = "auto";
  const node = {
    width: (value?: number | "auto") => {
      if (value === undefined) return fixed === "auto" ? contentWidth : fixed;
      fixed = value;
      return node;
    },
    isAuto: () => fixed === "auto",
  };
  return node as unknown as KonvaText & { isAuto: () => boolean };
};

describe("maxTextWidth", () => {
  it("es el 90 % del ancho del lienzo", () => {
    expect(maxTextWidth({ width: 1080, height: 1350 })).toBeCloseTo(972);
  });
});

describe("applyTextMaxWidth", () => {
  it("un texto que cabe se queda con su ancho automático", () => {
    const text = fakeText(500);
    applyTextMaxWidth(text, null, 972);
    expect(text.isAuto()).toBe(true);
    expect(text.width()).toBe(500);
  });

  it("un texto más ancho se limita al máximo (y Konva lo reparte en líneas)", () => {
    const text = fakeText(2000);
    applyTextMaxWidth(text, null, 972);
    expect(text.isAuto()).toBe(false);
    expect(text.width()).toBe(972);
  });

  it("justo en el máximo no se limita", () => {
    const text = fakeText(972);
    applyTextMaxWidth(text, null, 972);
    expect(text.isAuto()).toBe(true);
  });

  it("un texto con ancho fijado conserva el suyo, aunque pase del máximo", () => {
    const text = fakeText(2000);
    text.width(1500);
    applyTextMaxWidth(text, 1500, 972);
    expect(text.width()).toBe(1500);
  });

  it("si el texto se acorta, vuelve al ancho automático en vez de quedarse ancho", () => {
    const text = fakeText(2000);
    applyTextMaxWidth(text, null, 972);
    expect(text.width()).toBe(972);
    // El texto se acorta: el nodo mide menos que el máximo.
    const shorter = fakeText(300);
    shorter.width(972);
    applyTextMaxWidth(shorter, null, 972);
    expect(shorter.isAuto()).toBe(true);
    expect(shorter.width()).toBe(300);
  });
});
