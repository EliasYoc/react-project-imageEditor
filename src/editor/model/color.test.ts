import { describe, expect, it } from "vitest";
import { relativeLuminance } from "./color";

describe("relativeLuminance", () => {
  it("es 0 para el negro y 1 para el blanco", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });

  it("pesa más el verde que el rojo y el azul (valores de WCAG)", () => {
    expect(relativeLuminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.2126, 4);
    expect(relativeLuminance({ r: 0, g: 255, b: 0 })).toBeCloseTo(0.7152, 4);
    expect(relativeLuminance({ r: 0, g: 0, b: 255 })).toBeCloseTo(0.0722, 4);
  });
});
