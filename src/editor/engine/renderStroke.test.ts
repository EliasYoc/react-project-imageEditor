import { describe, expect, it } from "vitest";
import type { Point, StrokeEntry } from "../model/types";
import {
  createSprayState,
  paintStroke,
  sprayDabPositions,
  traceSmoothPath,
} from "./renderStroke";

/** Contexto 2D falso que registra las llamadas en orden. */
const createRecordingCtx = () => {
  const calls: unknown[][] = [];
  const record =
    (name: string) =>
    (...args: unknown[]) =>
      calls.push([name, ...args]);
  const ctx = {
    calls,
    globalCompositeOperation: "source-over",
    beginPath: record("beginPath"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    quadraticCurveTo: record("quadraticCurveTo"),
    stroke: record("stroke"),
    fillRect: record("fillRect"),
    save: () => calls.push(["save", ctx.globalCompositeOperation]),
    restore: () => {
      calls.push(["restore"]);
      ctx.globalCompositeOperation = "source-over";
    },
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };
  return ctx;
};

const asContext = (ctx: ReturnType<typeof createRecordingCtx>) =>
  ctx as unknown as CanvasRenderingContext2D;

const stroke = (
  brush: StrokeEntry["brush"],
  points: Point[],
  size = 10
): StrokeEntry => ({
  whatTask: "stroke",
  id: "s",
  brush,
  size,
  color: { r: 0, g: 0, b: 0, a: 1 },
  points: points.map((point) => ({ ...point, pressure: 0.5 })),
});

describe("traceSmoothPath", () => {
  it("no dibuja nada si no hay puntos", () => {
    const ctx = createRecordingCtx();
    traceSmoothPath(ctx, []);
    expect(ctx.calls).toEqual([]);
  });

  // Mismo caso de caracterización que redrawLastPath (lienzo legacy).
  it("suaviza el trazo con curvas cuadráticas entre puntos medios", () => {
    const ctx = createRecordingCtx();
    traceSmoothPath(ctx, [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ]);
    expect(ctx.calls).toEqual([
      ["beginPath"],
      ["moveTo", 0, 0],
      ["lineTo", 0, 0],
      ["quadraticCurveTo", 0, 0, 5, 0],
      ["quadraticCurveTo", 10, 0, 15, 0],
      ["lineTo", 20, 0],
      ["stroke"],
    ]);
  });

  it("con un solo punto dibuja un punto (un toque deja una marca)", () => {
    const ctx = createRecordingCtx();
    traceSmoothPath(ctx, [{ x: 3, y: 4 }]);
    expect(ctx.calls).toEqual([
      ["beginPath"],
      ["moveTo", 3, 4],
      ["lineTo", 3, 4],
      ["lineTo", 3, 4],
      ["stroke"],
    ]);
  });
});

describe("sprayDabPositions", () => {
  it("pone una mancha al empezar y luego una cada `spacing` píxeles", () => {
    const { dabs } = sprayDabPositions(
      [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
      ],
      10,
      createSprayState()
    );
    expect(dabs).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ]);
  });

  it("la densidad no depende de cuántos eventos lleguen", () => {
    const few = sprayDabPositions(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      10,
      createSprayState()
    );
    const many = sprayDabPositions(
      Array.from({ length: 101 }, (_, x) => ({ x, y: 0 })),
      10,
      createSprayState()
    );
    expect(many.dabs).toHaveLength(few.dabs.length);
  });

  it("por partes da las mismas manchas que de una vez (trazo en curso = trazo final)", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 7, y: 3 },
      { x: 18, y: 9 },
      { x: 18, y: 9 },
      { x: 40, y: -5 },
    ];
    const whole = sprayDabPositions(points, 6, createSprayState()).dabs;

    let state = createSprayState();
    const incremental: Point[] = [];
    for (const point of points) {
      const result = sprayDabPositions([point], 6, state);
      incremental.push(...result.dabs);
      state = result.state;
    }
    expect(incremental).toEqual(whole);
  });
});

describe("paintStroke", () => {
  it("el borrador pinta con destination-out y deja el contexto como estaba", () => {
    const ctx = createRecordingCtx();
    paintStroke(asContext(ctx), stroke("eraser", [{ x: 1, y: 1 }]));
    expect(ctx.calls[0]).toEqual(["save", "source-over"]);
    expect(ctx.calls).toContainEqual(["stroke"]);
    expect(ctx.calls.at(-1)).toEqual(["restore"]);
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });

  it("el spray pinta manchas (rectángulos con degradado) en vez de una línea", () => {
    const ctx = createRecordingCtx();
    paintStroke(
      asContext(ctx),
      stroke(
        "spray",
        [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
        ],
        100
      )
    );
    const names = ctx.calls.map(([name]) => name);
    expect(names).not.toContain("stroke");
    // spacing = 15 → manchas en 0, 15 y 30
    expect(names.filter((name) => name === "fillRect")).toHaveLength(3);
  });
});
