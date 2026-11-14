import { describe, expect, it } from "vitest";
import { getPointerSamples, normalizePressure, toStrokePoint } from "./pointer";

const sample = (clientX: number, clientY: number, pressure = 0.5) => ({
  clientX,
  clientY,
  pressure,
  pointerType: "pen",
});

describe("getPointerSamples", () => {
  it("usa los eventos agrupados cuando el navegador los da", () => {
    const coalesced = [sample(1, 1), sample(2, 2)];
    const event = {
      ...sample(2, 2),
      getCoalescedEvents: () => coalesced,
    } as unknown as PointerEvent;
    expect(getPointerSamples(event)).toBe(coalesced);
  });

  it("sin getCoalescedEvents (o si viene vacío) usa el propio evento", () => {
    const plain = sample(5, 5) as unknown as PointerEvent;
    expect(getPointerSamples(plain)).toEqual([plain]);

    const empty = {
      ...sample(5, 5),
      getCoalescedEvents: () => [],
    } as unknown as PointerEvent;
    expect(getPointerSamples(empty)).toEqual([empty]);
  });
});

describe("normalizePressure", () => {
  it("el ratón siempre da 0.5", () => {
    expect(normalizePressure({ pointerType: "mouse", pressure: 1 })).toBe(0.5);
  });

  it("el lápiz da su presión real y 0 se trata como 'sin dato'", () => {
    expect(normalizePressure({ pointerType: "pen", pressure: 0.8 })).toBe(0.8);
    expect(normalizePressure({ pointerType: "touch", pressure: 0 })).toBe(0.5);
  });
});

describe("toStrokePoint", () => {
  it("descuenta la posición del área en la pantalla y convierte al documento", () => {
    // Área que empieza 60px más abajo (hay un header) y documento a escala 0.5
    // centrado en vertical (250px vacíos arriba).
    const point = toStrokePoint(
      sample(250, 560, 0.3),
      { left: 0, top: 60 },
      { x: 0, y: 250, scale: 0.5 }
    );
    expect(point).toEqual({ x: 500, y: 500, pressure: 0.3 });
  });
});
