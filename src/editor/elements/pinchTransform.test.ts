import { describe, expect, it } from "vitest";
import {
  MAX_PINCH_SCALE,
  MIN_PINCH_SCALE,
  transformByPinch,
  type Fingers,
} from "./pinchTransform";

const start = { x: 100, y: 100, rotation: 0, scale: 1 };
const fingers: Fingers = [
  { x: 90, y: 100 },
  { x: 110, y: 100 },
];

describe("transformByPinch", () => {
  it("sin mover los dedos, el elemento no cambia", () => {
    expect(transformByPinch(start, fingers, fingers)).toEqual(start);
  });

  it("separar los dedos al doble duplica la escala alrededor de su punto medio", () => {
    const result = transformByPinch({ ...start, x: 80 }, fingers, [
      { x: 80, y: 100 },
      { x: 120, y: 100 },
    ]);
    expect(result.scale).toBeCloseTo(2);
    // Estaba 20 px a la izquierda del punto medio: ahora, 40.
    expect(result.x).toBeCloseTo(60);
    expect(result.y).toBeCloseTo(100);
  });

  it("girar los dedos gira el elemento alrededor de su punto medio", () => {
    const result = transformByPinch({ ...start, x: 120 }, fingers, [
      { x: 100, y: 90 },
      { x: 100, y: 110 },
    ]);
    expect(result.rotation).toBeCloseTo(90);
    expect(result.scale).toBeCloseTo(1);
    // Estaba 20 px a la derecha del centro (100, 100): ahora, 20 px abajo.
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(120);
  });

  it("mover los dos dedos a la vez desplaza el elemento", () => {
    const result = transformByPinch(start, fingers, [
      { x: 140, y: 130 },
      { x: 160, y: 130 },
    ]);
    expect(result).toEqual({ x: 150, y: 130, rotation: 0, scale: 1 });
  });

  it("el giro queda entre -180 y 180 grados", () => {
    const result = transformByPinch({ ...start, rotation: 170 }, fingers, [
      { x: 100, y: 90 },
      { x: 100, y: 110 },
    ]);
    expect(result.rotation).toBeCloseTo(-100);
  });

  it("la escala no pasa de sus límites, y la posición sigue a la escala real", () => {
    const tiny = transformByPinch({ ...start, x: 80 }, fingers, [
      { x: 99.99, y: 100 },
      { x: 100.01, y: 100 },
    ]);
    expect(tiny.scale).toBe(MIN_PINCH_SCALE);
    expect(tiny.x).toBeCloseTo(100 - 20 * MIN_PINCH_SCALE);

    const huge = transformByPinch(start, fingers, [
      { x: -1e5, y: 100 },
      { x: 1e5, y: 100 },
    ]);
    expect(huge.scale).toBe(MAX_PINCH_SCALE);
  });
});
