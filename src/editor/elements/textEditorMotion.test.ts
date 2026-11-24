import { describe, expect, it } from "vitest";
import type { Point } from "../model/types";
import {
  editorPose,
  elementPose,
  transformToPose,
  type ScreenPose,
} from "./textEditorMotion";

/** Dónde cae en pantalla el punto `p` de la caja (sin escalar) con esa pose. */
const placeInPose = (pose: ScreenPose, p: Point): Point => {
  const radians = (pose.rotation * Math.PI) / 180;
  const cos = Math.cos(radians) * pose.scale;
  const sin = Math.sin(radians) * pose.scale;
  return {
    x: pose.x + p.x * cos - p.y * sin,
    y: pose.y + p.x * sin + p.y * cos,
  };
};

describe("elementPose", () => {
  const view = { x: 50, y: 20, scale: 0.5 };

  it("lleva la esquina del texto a la pantalla y multiplica su escala por la de la vista", () => {
    expect(
      elementPose({ x: 100, y: 200, rotation: 30, scale: 2 }, view)
    ).toEqual({ x: 100, y: 120, rotation: 30, scale: 1 });
  });

  it("deja el giro entre -180 y 180: la animación va por el camino corto", () => {
    expect(
      elementPose({ x: 0, y: 0, rotation: 350, scale: 1 }, view).rotation
    ).toBe(-10);
  });
});

describe("editorPose", () => {
  it("coincide con donde lo pone el CSS del editor (translateX(-50%) scale, con el origen arriba en el centro)", () => {
    const placement = { left: 200, top: 300, scale: 0.5 };
    const width = 400;
    const height = 100;
    const pose = editorPose(placement, width);
    // Con su CSS, el punto (px, py) de la caja cae en
    // (left - scale · width / 2 + scale · px, top + scale · py).
    for (const p of [
      { x: 0, y: 0 },
      { x: width, y: height },
    ]) {
      expect(placeInPose(pose, p)).toEqual({
        x: 200 - 0.5 * 200 + 0.5 * p.x,
        y: 300 + 0.5 * p.y,
      });
    }
  });
});

describe("transformToPose", () => {
  it("mueve la esquina del editor hasta la de la pose, y la gira y escala", () => {
    expect(
      transformToPose(
        { x: 120, y: 80, rotation: -15, scale: 0.75 },
        { left: 200, top: 300 }
      )
    ).toBe("translate(-80px, -220px) rotate(-15deg) scale(0.75)");
  });
});
