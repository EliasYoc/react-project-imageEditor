import { describe, expect, it } from "vitest";
import { createDefaultTextStyle } from "../../../editor/model/factories";
import type { TextStyle } from "../../../editor/model/types";
import { PREVIEW_FONT_SIZE, PREVIEW_PADDING } from "../constants/textPreview";
import { previewLayout, previewText, textBleed } from "./textPreview";

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
