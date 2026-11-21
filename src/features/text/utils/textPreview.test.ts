import { describe, expect, it } from "vitest";
import { createDefaultTextStyle } from "../../../editor/model/factories";
import type { Rgba, TextStyle } from "../../../editor/model/types";
import {
  DARK_BACKDROP,
  LIGHT_BACKDROP,
  PREVIEW_FONT_SIZE,
  PREVIEW_PADDING,
} from "../constants/textPreview";
import {
  previewBackdrop,
  previewLayout,
  previewText,
  textBleed,
} from "./textPreview";

const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const RED: Rgba = { r: 255, g: 0, b: 0, a: 1 };
const YELLOW: Rgba = { r: 255, g: 220, b: 0, a: 1 };

const style = (extra: Partial<TextStyle> = {}) => ({
  ...createDefaultTextStyle(),
  fontSize: 100,
  ...extra,
});

describe("previewText", () => {
  it("deja igual un texto corto", () => {
    expect(previewText("Hola\nmundo")).toBe("Hola\nmundo");
  });

  it("muestra solo las 3 primeras líneas, con «…» al final", () => {
    expect(previewText("a\nb\nc\nd\ne")).toBe("a\nb\nc…");
  });

  it("corta una línea larga", () => {
    const shown = previewText("x".repeat(60));
    expect(shown).toBe("x".repeat(40) + "…");
  });
});

describe("previewBackdrop", () => {
  it("blanco para un texto oscuro o de color intenso", () => {
    expect(previewBackdrop(style({ color: BLACK }))).toBe(LIGHT_BACKDROP);
    expect(previewBackdrop(style({ color: RED }))).toBe(LIGHT_BACKDROP);
  });

  it("gris oscuro para un texto claro", () => {
    expect(previewBackdrop(style({ color: WHITE }))).toBe(DARK_BACKDROP);
    expect(previewBackdrop(style({ color: YELLOW }))).toBe(DARK_BACKDROP);
  });

  it("con contorno cuenta también su color: negro con contorno blanco se ve sobre gris", () => {
    const outlined = (strokeColor: Rgba) =>
      style({
        color: BLACK,
        stroke: { isEnabled: true, color: strokeColor, width: 0.1 },
      });
    expect(previewBackdrop(outlined(WHITE))).toBe(DARK_BACKDROP);
    expect(previewBackdrop(outlined(BLACK))).toBe(LIGHT_BACKDROP);
    // Desactivado, su color no cuenta.
    expect(
      previewBackdrop(
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
      previewBackdrop(
        style({ color: BLACK, gradient: gradient(WHITE, YELLOW) })
      )
    ).toBe(DARK_BACKDROP);
    expect(
      previewBackdrop(style({ color: WHITE, gradient: gradient(BLACK, RED) }))
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
    expect(previewBackdrop(boxed(WHITE))).toBe(DARK_BACKDROP);
    expect(previewBackdrop(boxed(BLACK))).toBe(LIGHT_BACKDROP);
  });
});

describe("textBleed", () => {
  it("es 0 sin contorno ni sombra", () => {
    expect(textBleed(style())).toBe(0);
  });

  it("toma el mayor entre el contorno y la sombra (desplazamiento + desenfoque)", () => {
    const base = style();
    expect(
      textBleed({
        ...base,
        stroke: { ...base.stroke, isEnabled: true, width: 0.1 },
        shadow: { ...base.shadow, isEnabled: true, blur: 0.2, offset: 0.1 },
      })
    ).toBeCloseTo(30);
    expect(
      textBleed({
        ...base,
        stroke: { ...base.stroke, isEnabled: true, width: 0.25 },
      })
    ).toBeCloseTo(25);
  });
});

describe("previewLayout", () => {
  const area = { width: 300, height: 88 };

  it("con un texto que cabe, usa el tamaño de letra de la vista previa y lo centra", () => {
    const { scale, x, y } = previewLayout(
      { width: 200, height: 50 },
      100,
      0,
      area
    );
    expect(scale).toBeCloseTo(PREVIEW_FONT_SIZE / 100);
    // El centro del texto, ya escalado, es el centro del área.
    expect((x + 100) * scale).toBeCloseTo(area.width / 2);
    expect((y + 25) * scale).toBeCloseTo(area.height / 2);
  });

  it("encoge un texto demasiado ancho para que quepa con su aire", () => {
    const { scale } = previewLayout({ width: 3000, height: 50 }, 100, 0, area);
    expect(3000 * scale).toBeCloseTo(area.width - 2 * PREVIEW_PADDING);
  });

  it("encoge un texto demasiado alto", () => {
    const { scale } = previewLayout({ width: 100, height: 800 }, 100, 0, area);
    expect(800 * scale).toBeCloseTo(area.height - 2 * PREVIEW_PADDING);
  });

  it("deja sitio para el contorno y la sombra", () => {
    const { scale } = previewLayout({ width: 3000, height: 50 }, 100, 50, area);
    expect((3000 + 2 * 50) * scale).toBeCloseTo(
      area.width - 2 * PREVIEW_PADDING
    );
  });
});
