import { describe, expect, it } from "vitest";
import { createDefaultTextStyle } from "../model/factories";
import type { Rgba, TextStyle } from "../model/types";
import {
  DARK_BACKDROP,
  LIGHT_BACKDROP,
  readableBackdrop,
} from "./readableBackdrop";

const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const RED: Rgba = { r: 255, g: 0, b: 0, a: 1 };
const YELLOW: Rgba = { r: 255, g: 220, b: 0, a: 1 };

/** Un texto sin caja de fondo (con caja, solo cuenta la caja). */
const style = (extra: Partial<TextStyle> = {}) => {
  const defaults = createDefaultTextStyle();
  return {
    ...defaults,
    background: { ...defaults.background, isEnabled: false },
    fontSize: 100,
    ...extra,
  };
};

describe("readableBackdrop", () => {
  it("blanco para un texto oscuro o de color intenso", () => {
    expect(readableBackdrop(style({ color: BLACK }))).toBe(LIGHT_BACKDROP);
    expect(readableBackdrop(style({ color: RED }))).toBe(LIGHT_BACKDROP);
  });

  it("gris oscuro para un texto claro", () => {
    expect(readableBackdrop(style({ color: WHITE }))).toBe(DARK_BACKDROP);
    expect(readableBackdrop(style({ color: YELLOW }))).toBe(DARK_BACKDROP);
  });

  it("con contorno cuenta también su color: negro con contorno blanco se ve sobre gris", () => {
    const outlined = (strokeColor: Rgba) =>
      style({
        color: BLACK,
        stroke: { isEnabled: true, color: strokeColor, width: 0.1 },
      });
    expect(readableBackdrop(outlined(WHITE))).toBe(DARK_BACKDROP);
    expect(readableBackdrop(outlined(BLACK))).toBe(LIGHT_BACKDROP);
    // Desactivado, su color no cuenta.
    expect(
      readableBackdrop(
        style({
          color: BLACK,
          stroke: { isEnabled: false, color: WHITE, width: 0.1 },
        })
      )
    ).toBe(LIGHT_BACKDROP);
  });

  it("con degradado usa la media de sus colores", () => {
    const gradient = (from: Rgba, to: Rgba): TextStyle["gradient"] => ({
      type: "linear",
      angle: 90,
      center: { x: 0.5, y: 0.5 },
      stops: [
        { id: "a", color: from, offset: 0 },
        { id: "b", color: to, offset: 1 },
      ],
    });
    // Texto negro, pero el degradado es el que se ve: claro.
    expect(
      readableBackdrop(
        style({ color: BLACK, gradient: gradient(WHITE, YELLOW) })
      )
    ).toBe(DARK_BACKDROP);
    expect(
      readableBackdrop(style({ color: WHITE, gradient: gradient(BLACK, RED) }))
    ).toBe(LIGHT_BACKDROP);
  });

  it("con caja de fondo cuenta solo el color de la caja", () => {
    const boxed = (boxColor: Rgba) =>
      style({
        color: BLACK,
        background: {
          isEnabled: true,
          color: boxColor,
          padding: 0.25,
          radius: 0.2,
        },
      });
    // Caja clara: sobre blanco no se vería.
    expect(readableBackdrop(boxed(WHITE))).toBe(DARK_BACKDROP);
    expect(readableBackdrop(boxed(BLACK))).toBe(LIGHT_BACKDROP);
  });
});
