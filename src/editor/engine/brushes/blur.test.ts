import { describe, expect, it } from "vitest";
import { BLUR_AMOUNT, blurGeometry } from "./blur";

describe("blurGeometry (copia reducida para desenfocar)", () => {
  it("reduce la copia hasta que el radio queda en 4 px", () => {
    // 2 % de 1440 = 28,8 px de radio → se reduce 7,2 veces.
    expect(blurGeometry({ width: 1440, height: 2560 })).toEqual({
      width: 200,
      height: 356,
      radius: 4,
    });
  });

  it("cuesta casi lo mismo en un lienzo pequeño que en una foto de 12 MP", () => {
    const small = blurGeometry({ width: 1080, height: 1920 });
    const large = blurGeometry({ width: 3000, height: 4000 });
    const pixels = (size: { width: number; height: number }) =>
      size.width * size.height;
    expect(pixels(large) / pixels(small)).toBeLessThan(1.5);
    expect(large.radius).toBe(small.radius);
  });

  it("es una proporción: al exportar al doble de tamaño, la copia es la misma", () => {
    expect(blurGeometry({ width: 2880, height: 5120 })).toEqual(
      blurGeometry({ width: 1440, height: 2560 })
    );
  });

  it("no amplía: si el radio ya es pequeño, se desenfoca a tamaño real", () => {
    // 2 % de 150 = 3 px: no hace falta reducir.
    expect(blurGeometry({ width: 200, height: 150 })).toEqual({
      width: 200,
      height: 150,
      radius: 3,
    });
  });

  it("con otra intensidad cambia el radio (las vistas previas usan una mayor)", () => {
    const normal = blurGeometry({ width: 140, height: 52 });
    const strong = blurGeometry({ width: 140, height: 52 }, BLUR_AMOUNT * 3);
    expect(normal.radius).toBe(1);
    expect(strong.radius).toBeGreaterThan(normal.radius);
  });
});
