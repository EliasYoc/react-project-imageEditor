import { describe, expect, it, vi } from "vitest";
import type { BrushStroke } from "./brushStroke";
import { createLiveRenderer, paintStroke, strokeBlend } from "./paint";

// jsdom no tiene canvas 2D: las puntas de los sellos se sustituyen por un
// objeto cualquiera (solo se comprueba qué se dibuja y cómo se compone).
vi.mock("./tips", () => ({
  getTip: () => ({ tip: true }),
  tipBucket: (size: number) => size,
}));

/** Contexto falso que registra las llamadas y el estado en cada una. */
const createContext = (name: string, width = 100, height = 100) => {
  const calls: { op: string; alpha: number; blend: string; args: unknown[] }[] =
    [];
  const stack: { alpha: number; blend: string }[] = [];
  const ctx = {
    name,
    canvas: { width, height },
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "",
    calls,
    record(op: string, args: unknown[]) {
      calls.push({
        op,
        alpha: ctx.globalAlpha,
        blend: ctx.globalCompositeOperation,
        args,
      });
    },
    save: () =>
      stack.push({
        alpha: ctx.globalAlpha,
        blend: ctx.globalCompositeOperation,
      }),
    restore: () => {
      const state = stack.pop();
      if (state) {
        ctx.globalAlpha = state.alpha;
        ctx.globalCompositeOperation = state.blend;
      }
    },
    getTransform: () => ({ a: 1, b: 0 }),
    setTransform: (...args: unknown[]) => ctx.record("setTransform", args),
    clearRect: (...args: unknown[]) => ctx.record("clearRect", args),
    beginPath: () => {},
    moveTo: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},
    fill: () => ctx.record("fill", []),
    drawImage: (...args: unknown[]) => ctx.record("drawImage", args),
    translate: () => {},
    rotate: () => {},
  };
  return ctx;
};

const asCtx = (ctx: ReturnType<typeof createContext>) =>
  ctx as unknown as CanvasRenderingContext2D;

const createScratch = () => {
  const buffer = createContext("buffer");
  const scratch = { width: 0, height: 0, getContext: () => buffer };
  return { buffer, scratch: scratch as unknown as HTMLCanvasElement };
};

const stroke = (brush: BrushStroke["brush"], opacity: number): BrushStroke => ({
  brush,
  color: { r: 10, g: 20, b: 30, a: 1 },
  size: 10,
  opacity,
  seed: 1,
  hasPressure: false,
  points: [
    { x: 10, y: 10, pressure: 0.5 },
    { x: 60, y: 40, pressure: 0.5 },
  ],
});

describe("paintStroke", () => {
  it("opacidad 1 y modo normal: pinta directamente, sin búfer", () => {
    const target = createContext("target");
    const { buffer, scratch } = createScratch();
    paintStroke(asCtx(target), stroke("marker", 1), scratch);

    expect(target.calls.map((c) => c.op)).toEqual(["fill"]);
    expect(buffer.calls).toEqual([]);
  });

  it("con opacidad: dibuja la forma en el búfer y la compone una sola vez con esa opacidad", () => {
    const target = createContext("target", 300, 200);
    const { buffer, scratch } = createScratch();
    paintStroke(asCtx(target), stroke("marker", 0.4), scratch);

    // El búfer se ajusta al tamaño del destino y se limpia antes de usarse.
    expect(scratch.width).toBe(300);
    expect(buffer.calls.map((c) => c.op)).toEqual([
      "setTransform",
      "clearRect",
      "setTransform",
      "fill",
    ]);
    // La forma va opaca al búfer…
    expect(buffer.calls.at(-1)?.alpha).toBe(1);
    // …y se compone con la opacidad del trazo.
    const composite = target.calls.find((c) => c.op === "drawImage");
    expect(composite).toMatchObject({ alpha: 0.4, blend: "source-over" });
    expect(composite?.args[0]).toBe(scratch);
    // El contexto del destino queda como estaba.
    expect(target.globalAlpha).toBe(1);
    expect(target.globalCompositeOperation).toBe("source-over");
  });

  it("el resaltador (multiply) siempre pasa por el búfer", () => {
    const target = createContext("target");
    const { buffer, scratch } = createScratch();
    paintStroke(asCtx(target), stroke("highlighter", 1), scratch);

    expect(buffer.calls.some((c) => c.op === "drawImage")).toBe(true);
    expect(target.calls.at(-1)).toMatchObject({
      op: "drawImage",
      blend: "multiply",
    });
  });

  it("los borradores componen con destination-out", () => {
    const target = createContext("target");
    paintStroke(
      asCtx(target),
      stroke("eraserHard", 1),
      createScratch().scratch
    );
    expect(strokeBlend(stroke("eraserHard", 1))).toBe("destination-out");
    expect(target.calls.every((c) => c.blend === "destination-out")).toBe(true);
  });
});

describe("createLiveRenderer", () => {
  it("tinta: repinta el trazo entero (limpia y vuelve a rellenar)", () => {
    const live = createContext("live");
    const renderer = createLiveRenderer(asCtx(live), stroke("pen", 1));
    const points = stroke("pen", 1).points;
    renderer.update(points.slice(0, 1), points.slice(0, 1));
    renderer.update(points, points.slice(1));
    expect(live.calls.map((c) => c.op)).toEqual([
      "clearRect",
      "fill",
      "clearRect",
      "fill",
    ]);
  });

  it("sellos: solo estampa los sellos nuevos, sin limpiar", () => {
    const live = createContext("live");
    const s = stroke("airbrush", 1);
    const renderer = createLiveRenderer(asCtx(live), s);
    renderer.update(s.points.slice(0, 1), s.points.slice(0, 1));
    const afterFirst = live.calls.length;
    renderer.update(s.points, s.points.slice(1));
    expect(live.calls.some((c) => c.op === "clearRect")).toBe(false);
    expect(live.calls.length).toBeGreaterThan(afterFirst);
  });
});
