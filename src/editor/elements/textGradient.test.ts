import type { Text as KonvaText } from "konva/lib/shapes/Text";
import { describe, expect, it, vi } from "vitest";
import { gradientToCss } from "../engine/fill/css";
import type { Gradient, Rgba } from "../model/types";
import {
  SOLID_TEXT_FILL,
  applyTextFill,
  textEditorPaint,
  textFillAttrs,
  textGradientAttrs,
  textGradientCss,
} from "./textGradient";

const RED: Rgba = { r: 255, g: 0, b: 0, a: 1 };
const BLUE: Rgba = { r: 0, g: 0, b: 255, a: 1 };

const gradient = (extra: Partial<Gradient> = {}): Gradient => ({
  type: "linear",
  angle: 90,
  center: { x: 0.5, y: 0.5 },
  // Desordenadas y una fuera de rango: se ordenan y se recortan.
  stops: [
    { id: "b", color: BLUE, offset: 1.2 },
    { id: "a", color: RED, offset: 0 },
  ],
  ...extra,
});

/** Caja de 200×100 desplazada por un margen interior de (10, 5). */
const BOX = { x: 10, y: 5, width: 200, height: 100 };

/** Redondea los puntos (la trigonometría deja decimales como 55.000000001). */
const rounded = (attrs: object) =>
  JSON.parse(
    JSON.stringify(attrs, (_, value) =>
      typeof value === "number" ? Math.round(value * 1e6) / 1e6 : value
    )
  );

describe("textGradientAttrs", () => {
  it("lineal a 90°: de izquierda a derecha por el centro de la caja", () => {
    expect(rounded(textGradientAttrs(gradient(), BOX))).toEqual({
      fillPriority: "linear-gradient",
      fillLinearGradientStartPoint: { x: 10, y: 55 },
      fillLinearGradientEndPoint: { x: 210, y: 55 },
      fillLinearGradientColorStops: [
        0,
        "rgba(255, 0, 0, 1)",
        1,
        "rgba(0, 0, 255, 1)",
      ],
    });
  });

  it("lineal a 180°: de arriba abajo", () => {
    expect(
      rounded(textGradientAttrs(gradient({ angle: 180 }), BOX))
    ).toMatchObject({
      fillLinearGradientStartPoint: { x: 110, y: 5 },
      fillLinearGradientEndPoint: { x: 110, y: 105 },
    });
  });

  it("radial: círculo desde el centro hasta la esquina más lejana", () => {
    const attrs = textGradientAttrs(
      gradient({ type: "radial", center: { x: 0.25, y: 0.5 } }),
      BOX
    );
    expect(attrs).toMatchObject({
      fillPriority: "radial-gradient",
      fillRadialGradientStartPoint: { x: 60, y: 55 },
      fillRadialGradientEndPoint: { x: 60, y: 55 },
      fillRadialGradientStartRadius: 0,
    });
    // La esquina más lejana del centro (50, 50) es (200, 0 o 100).
    expect(attrs.fillRadialGradientEndRadius).toBeCloseTo(Math.hypot(150, 50));
  });

  it("un cónico (que el texto no admite) se pinta como radial", () => {
    expect(
      textGradientAttrs(gradient({ type: "conic" }), BOX).fillPriority
    ).toBe("radial-gradient");
  });

  it("sin degradado, el texto usa su color", () => {
    expect(textFillAttrs(null, BOX)).toBe(SOLID_TEXT_FILL);
  });
});

describe("applyTextFill", () => {
  it("reparte el degradado en la caja medida, sin el margen interior", () => {
    const setAttrs = vi.fn();
    const node = {
      padding: () => 5,
      width: () => 210,
      height: () => 110,
      setAttrs,
    } as unknown as KonvaText;
    applyTextFill(node, gradient());
    expect(rounded(setAttrs.mock.calls[0][0])).toMatchObject({
      fillLinearGradientStartPoint: { x: 5, y: 55 },
      fillLinearGradientEndPoint: { x: 205, y: 55 },
    });
  });

  it("al quitar el degradado vuelve al color", () => {
    const setAttrs = vi.fn();
    const node = {
      padding: () => 0,
      width: () => 10,
      height: () => 10,
      setAttrs,
    } as unknown as KonvaText;
    applyTextFill(node, null);
    expect(setAttrs).toHaveBeenCalledWith(SOLID_TEXT_FILL);
  });
});

describe("degradado del texto en CSS", () => {
  it("lineal: el mismo CSS que el fondo", () => {
    expect(textGradientCss(gradient())).toBe(gradientToCss(gradient()));
  });

  it("radial (y cónico): un círculo, como en el lienzo", () => {
    const css = textGradientCss(gradient({ type: "conic" }));
    expect(css).toMatch(/^radial-gradient\(circle farthest-corner at 50% 50%/);
  });

  const style = {
    color: RED,
    background: { isEnabled: false, color: BLUE, padding: 0.2, radius: 0.2 },
  };

  it("sin degradado, el textarea usa el color (y la caja si la hay)", () => {
    expect(textEditorPaint({ ...style, gradient: null })).toEqual({
      color: "rgba(255, 0, 0, 1)",
    });
    expect(
      textEditorPaint({
        ...style,
        gradient: null,
        background: { ...style.background, isEnabled: true },
      })
    ).toEqual({
      color: "rgba(255, 0, 0, 1)",
      background: "rgba(0, 0, 255, 1)",
    });
  });

  it("con degradado, se recorta a las letras y la caja va debajo", () => {
    const paint = textEditorPaint({
      ...style,
      gradient: gradient(),
      background: { ...style.background, isEnabled: true },
    });
    expect(paint.color).toBe("transparent");
    expect(paint.backgroundImage).toBe(
      `${textGradientCss(gradient())}, linear-gradient(rgba(0, 0, 255, 1), rgba(0, 0, 255, 1))`
    );
    expect(paint.backgroundClip).toBe("text, border-box");
  });
});
