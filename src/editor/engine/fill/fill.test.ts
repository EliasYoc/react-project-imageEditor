import { describe, expect, it } from "vitest";
import type { Gradient } from "../../model/types";
import {
  conicStartAngle,
  linearGradientLine,
  radialGradientEllipse,
} from "./geometry";
import { paintFill } from "./paintFill";
import { GRADIENT_PRESETS } from "./presets";
import {
  MAX_STOPS,
  MIN_STOPS,
  addStop,
  colorAt,
  moveStop,
  removeStop,
  setStopColor,
} from "./stops";

const close = (actual: number, expected: number) =>
  expect(actual).toBeCloseTo(expected, 6);

const twoStops = (): Gradient => ({
  type: "linear",
  angle: 90,
  center: { x: 0.5, y: 0.5 },
  stops: [
    { id: "a", color: { r: 0, g: 0, b: 0, a: 1 }, offset: 0 },
    { id: "b", color: { r: 200, g: 100, b: 50, a: 0 }, offset: 1 },
  ],
});

describe("geometría de CSS", () => {
  it("lineal 90°: de izquierda a derecha por el centro", () => {
    const line = linearGradientLine(90, { width: 200, height: 100 });
    close(line.x0, 0);
    close(line.y0, 50);
    close(line.x1, 200);
    close(line.y1, 50);
  });

  it("lineal 180° (el de CSS por defecto): de arriba a abajo", () => {
    const line = linearGradientLine(180, { width: 200, height: 100 });
    close(line.x0, 100);
    close(line.y0, 0);
    close(line.y1, 100);
  });

  it("lineal 45° en un cuadrado: la línea mide el lado × √2 (llega a las esquinas)", () => {
    const line = linearGradientLine(45, { width: 100, height: 100 });
    close(Math.hypot(line.x1 - line.x0, line.y1 - line.y0), 100 * Math.SQRT2);
    // Va de abajo a la izquierda hacia arriba a la derecha.
    close(line.x0, 0);
    close(line.y0, 100);
    close(line.x1, 100);
    close(line.y1, 0);
  });

  it("radial: elipse farthest-corner (farthest-side × √2) en el centro elegido", () => {
    expect(
      radialGradientEllipse({ x: 0.5, y: 0.5 }, { width: 200, height: 100 })
    ).toEqual({
      cx: 100,
      cy: 50,
      rx: 100 * Math.SQRT2,
      ry: 50 * Math.SQRT2,
    });
    const offCenter = radialGradientEllipse(
      { x: 0.25, y: 0 },
      { width: 200, height: 100 }
    );
    close(offCenter.rx, 150 * Math.SQRT2);
    close(offCenter.ry, 100 * Math.SQRT2);
  });

  it("cónico: 0° de CSS (arriba) es −90° en canvas", () => {
    close(conicStartAngle(0), -Math.PI / 2);
    close(conicStartAngle(90), 0);
  });
});

describe("paradas", () => {
  it("colorAt interpola entre las paradas (también la transparencia)", () => {
    expect(colorAt(twoStops().stops, 0.5)).toEqual({
      r: 100,
      g: 50,
      b: 25,
      a: 0.5,
    });
    expect(colorAt(twoStops().stops, -1)).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it("addStop añade el color que ya había en ese punto", () => {
    const next = addStop(twoStops(), 0.25, "nueva");
    expect(next.stops.find((stop) => stop.id === "nueva")).toEqual({
      id: "nueva",
      offset: 0.25,
      color: { r: 50, g: 25, b: 13, a: 0.75 },
    });
  });

  it(`como máximo ${MAX_STOPS} y como mínimo ${MIN_STOPS} paradas`, () => {
    let gradient = twoStops();
    for (let i = 0; i < 10; i++) gradient = addStop(gradient, i / 10);
    expect(gradient.stops).toHaveLength(MAX_STOPS);

    let small = twoStops();
    small = removeStop(small, "a");
    expect(small.stops).toHaveLength(MIN_STOPS);
  });

  it("moveStop limita la posición a 0–1 y setStopColor cambia solo esa parada", () => {
    const moved = moveStop(twoStops(), "a", 1.4);
    expect(moved.stops[0].offset).toBe(1);
    const recolored = setStopColor(twoStops(), "b", { r: 1, g: 2, b: 3, a: 1 });
    expect(recolored.stops[1].color).toEqual({ r: 1, g: 2, b: 3, a: 1 });
    expect(recolored.stops[0].color).toEqual(twoStops().stops[0].color);
  });
});

describe("paintFill", () => {
  /** Contexto falso que registra qué degradado se crea y sus paradas. */
  const createContext = () => {
    const calls: unknown[][] = [];
    const gradient = {
      addColorStop: (...args: unknown[]) => calls.push(["stop", ...args]),
    };
    const ctx = {
      calls,
      fillStyle: null as unknown,
      save: () => {},
      restore: () => {},
      translate: (...args: unknown[]) => calls.push(["translate", ...args]),
      scale: (...args: unknown[]) => calls.push(["scale", ...args]),
      fillRect: (...args: unknown[]) => calls.push(["fillRect", ...args]),
      createLinearGradient: (...args: unknown[]) => {
        calls.push(["linear", ...args]);
        return gradient;
      },
      createRadialGradient: (...args: unknown[]) => {
        calls.push(["radial", ...args]);
        return gradient;
      },
    };
    return ctx;
  };

  it("color sólido: un rectángulo del tamaño indicado", () => {
    const ctx = createContext();
    paintFill(
      ctx as unknown as CanvasRenderingContext2D,
      { kind: "color", color: { r: 1, g: 2, b: 3, a: 1 } },
      { width: 40, height: 30 }
    );
    expect(ctx.fillStyle).toBe("rgba(1, 2, 3, 1)");
    expect(ctx.calls).toEqual([["fillRect", 0, 0, 40, 30]]);
  });

  it("lineal: usa la línea de CSS y las paradas en orden", () => {
    const ctx = createContext();
    const gradient = twoStops();
    gradient.stops.reverse();
    paintFill(
      ctx as unknown as CanvasRenderingContext2D,
      { kind: "gradient", gradient },
      { width: 200, height: 100 }
    );
    const [name, ...line] = ctx.calls[0] as [string, ...number[]];
    expect(name).toBe("linear");
    [0, 50, 200, 50].forEach((value, index) => close(line[index], value));
    expect(
      ctx.calls.filter(([name]) => name === "stop").map(([, offset]) => offset)
    ).toEqual([0, 1]);
  });

  it("radial: elipse con escala en y y relleno que cubre todo el lienzo", () => {
    const ctx = createContext();
    paintFill(
      ctx as unknown as CanvasRenderingContext2D,
      { kind: "gradient", gradient: { ...twoStops(), type: "radial" } },
      { width: 200, height: 100 }
    );
    expect(ctx.calls[0]).toEqual(["translate", 100, 50]);
    expect(ctx.calls[1]).toEqual(["scale", 1, 0.5]);
    expect(ctx.calls[2]).toEqual(["radial", 0, 0, 0, 0, 0, 100 * Math.SQRT2]);
    expect(ctx.calls.at(-1)).toEqual(["fillRect", -100, -100, 200, 200]);
  });
});

describe("presets", () => {
  it("todos tienen al menos 2 paradas dentro de 0–1", () => {
    for (const { gradient } of GRADIENT_PRESETS) {
      expect(gradient.stops.length).toBeGreaterThanOrEqual(2);
      for (const stop of gradient.stops) {
        expect(stop.offset).toBeGreaterThanOrEqual(0);
        expect(stop.offset).toBeLessThanOrEqual(1);
      }
    }
  });
});
