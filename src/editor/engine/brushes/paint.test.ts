import { beforeEach, describe, expect, it, vi } from "vitest";
import { blurLayers } from "./blur";
import type { BrushStroke } from "./brushStroke";
import {
  createLiveRenderer,
  paintBlurMask,
  paintStroke,
  strokeBlend,
} from "./paint";

// jsdom no tiene canvas 2D: las puntas de los sellos se sustituyen por un
// objeto cualquiera (solo se comprueba qué se dibuja y cómo se compone).
vi.mock("./tips", () => ({
  getTip: (tip: unknown) => ({ tip }),
  tipBucket: (size: number) => size,
}));

const fakes = vi.hoisted(() => ({
  /** La "copia desenfocada": cuatro veces más pequeña que el lienzo de prueba. */
  blurred: { name: "copia desenfocada", width: 100, height: 50 },
  /** Los canvas que crea el motor (el del trazo de desenfoque en curso). */
  canvases: [] as { width: number; height: number; ctx: unknown }[],
}));

// El desenfoque lee píxeles (no se puede en jsdom): aquí solo se comprueba
// con qué se llama y en qué orden.
vi.mock("./blur", () => ({
  blurLayers: vi.fn(() => fakes.blurred),
  revealBlurred: (
    ctx: { record: (op: string, args: unknown[]) => void },
    blurred: unknown
  ) => ctx.record("revealBlurred", [blurred]),
}));

vi.mock("../../../lib/canvas", () => ({
  createCanvas: (size: { width: number; height: number }) => {
    const ctx = createContext("batch", size.width, size.height);
    const canvas = { ...size, ctx, getContext: () => ctx };
    fakes.canvases.push(canvas);
    return canvas;
  },
  get2dContext: (canvas: { getContext: () => unknown }) => canvas.getContext(),
}));

/** Todas las llamadas, de todos los contextos, en orden: "contexto:operación". */
const timeline: string[] = [];

beforeEach(() => {
  timeline.length = 0;
  fakes.canvases.length = 0;
  vi.mocked(blurLayers).mockClear();
});

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
      timeline.push(`${name}:${op}`);
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

/** Lo que se dibujó en un contexto (sin los cambios de transformación). */
const draws = (ctx: ReturnType<typeof createContext>) =>
  ctx.calls.filter((call) => call.op === "drawImage");

describe("desenfoque", () => {
  it("desenfoca la capa en el sitio: le quita la máscara y le suma la copia desenfocada", () => {
    const target = createContext("target", 300, 200);
    const { buffer, scratch } = createScratch();
    paintStroke(asCtx(target), stroke("blur", 0.6), scratch);

    // La copia desenfocada es de la propia capa.
    expect(blurLayers).toHaveBeenCalledTimes(1);
    const [sources, size] = vi.mocked(blurLayers).mock.calls[0];
    expect(sources).toEqual([{ image: target.canvas }]);
    expect(size).toBe(target.canvas);

    // capa × (1 − máscara) + copia × máscara, con la intensidad del trazo.
    expect(
      timeline.filter(
        (step) => step === "target:drawImage" || step === "buffer:revealBlurred"
      )
    ).toEqual(["target:drawImage", "buffer:revealBlurred", "target:drawImage"]);
    const [erase, add] = draws(target);
    expect(erase).toMatchObject({ blend: "destination-out", alpha: 0.6 });
    expect(add).toMatchObject({ blend: "lighter", alpha: 0.6 });
    expect(erase.args[0]).toBe(scratch);
    expect(add.args[0]).toBe(scratch);
    // El búfer acaba siendo la copia desenfocada recortada con la máscara.
    expect(buffer.calls.at(-1)).toMatchObject({
      op: "revealBlurred",
      args: [fakes.blurred],
    });
    // El contexto del destino queda como estaba.
    expect(target.globalAlpha).toBe(1);
    expect(target.globalCompositeOperation).toBe("source-over");
  });

  it("la copia se saca antes de tocar la capa", () => {
    const target = createContext("target");
    vi.mocked(blurLayers).mockImplementationOnce(() => {
      expect(target.calls).toEqual([]);
      return fakes.blurred as unknown as HTMLCanvasElement;
    });
    paintStroke(asCtx(target), stroke("blur", 1), createScratch().scratch);
    expect(draws(target)).toHaveLength(2);
  });

  it("acepta otra intensidad (la de las vistas previas)", () => {
    paintStroke(
      asCtx(createContext("target")),
      stroke("blur", 1),
      createScratch().scratch,
      { blurAmount: 0.06 }
    );
    expect(vi.mocked(blurLayers).mock.calls[0][2]).toMatchObject({
      amount: 0.06,
    });
  });

  it("sin búfer no hay máscara: no toca la capa", () => {
    const target = createContext("target");
    paintStroke(asCtx(target), stroke("blur", 1), null);
    expect(target.calls).toEqual([]);
  });

  it("los demás pinceles no desenfocan nada", () => {
    for (const brush of ["pen", "airbrush", "eraserSoft"] as const) {
      paintStroke(
        asCtx(createContext("target")),
        stroke(brush, 0.5),
        createScratch().scratch
      );
    }
    expect(blurLayers).not.toHaveBeenCalled();
  });
});

describe("paintBlurMask (máscara del desenfoque del fondo)", () => {
  it("el desenfoque rellena la máscara y el borrador la vacía, sin desenfocar nada", () => {
    const filled = createContext("target");
    paintBlurMask(asCtx(filled), stroke("blur", 1), createScratch().scratch);
    expect(filled.calls.length).toBeGreaterThan(0);
    expect(filled.calls.every((c) => c.blend === "source-over")).toBe(true);

    const erased = createContext("target");
    paintBlurMask(
      asCtx(erased),
      stroke("eraserHard", 1),
      createScratch().scratch
    );
    expect(erased.calls.length).toBeGreaterThan(0);
    expect(erased.calls.every((c) => c.blend === "destination-out")).toBe(true);
    expect(blurLayers).not.toHaveBeenCalled();
  });

  it("con opacidad, la forma se compone una vez con la intensidad del trazo", () => {
    const target = createContext("target");
    const { scratch } = createScratch();
    paintBlurMask(asCtx(target), stroke("blur", 0.4), scratch);
    const composites = draws(target);
    expect(composites).toHaveLength(1);
    expect(composites[0]).toMatchObject({ alpha: 0.4, blend: "source-over" });
    expect(composites[0].args[0]).toBe(scratch);
  });
});

describe("pincel de formas", () => {
  /** Las puntas (falsas) que se estamparon, en orden. */
  const stampedTips = (shape?: BrushStroke["shape"]) => {
    const target = createContext("target");
    const points = [
      { x: 0, y: 0, pressure: 0.5 },
      { x: 400, y: 0, pressure: 0.5 },
    ];
    paintStroke(
      asCtx(target),
      { ...stroke("shapes", 1), shape, points },
      createScratch().scratch
    );
    return target.calls
      .filter((c) => c.op === "drawImage")
      .map((c) => (c.args[0] as { tip: unknown }).tip);
  };

  it("estampa la punta de la figura del trazo", () => {
    const tips = stampedTips("triangle");
    expect(tips.length).toBeGreaterThan(5);
    for (const tip of tips) {
      expect(tip).toEqual({ shape: "stamp", figure: "triangle" });
    }
  });

  it("sin figura (trazos antiguos) estampa círculos", () => {
    expect(stampedTips()[0]).toEqual({ shape: "stamp", figure: "circle" });
  });

  it("la mezcla cambia de punta de un sello a otro", () => {
    const figures = new Set(
      stampedTips("mix").map((tip) => (tip as { figure: string }).figure)
    );
    expect(figures.size).toBeGreaterThan(1);
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

  it("desenfoque: los sellos nuevos revelan la copia ya desenfocada, sin desenfocar nada", () => {
    // Lienzo de 400 × 200 y copia de 100 × 50: cuatro veces más pequeña.
    const live = createContext("live", 400, 200);
    const s = stroke("blur", 1);
    const renderer = createLiveRenderer(asCtx(live), s, {
      blurred: fakes.blurred as unknown as HTMLCanvasElement,
    });
    renderer.update(s.points, s.points);

    // En el lienzo solo se pega un recuadro: el de los sellos nuevos.
    expect(live.calls.map((c) => c.op)).toEqual(["drawImage"]);
    const [batch] = fakes.canvases;
    const [image, sx, sy, sw, sh, dx, dy, dw, dh] = live.calls[0].args as [
      unknown,
      ...number[],
    ];
    expect(image).toBe(batch);
    expect([sx, sy]).toEqual([0, 0]);
    expect([dw, dh]).toEqual([sw, sh]);
    expect(dx).toBeGreaterThanOrEqual(0);
    expect(dx + dw).toBeLessThanOrEqual(400);
    expect(dw).toBeLessThan(100);

    // En el recuadro: primero los sellos (la máscara) y después la misma
    // zona de la copia, que solo se queda donde hay máscara.
    const steps = (batch.ctx as ReturnType<typeof createContext>).calls.filter(
      (c) => c.op === "drawImage"
    );
    expect(steps.length).toBeGreaterThan(1);
    expect(steps.slice(0, -1).every((c) => c.blend === "source-over")).toBe(
      true
    );
    const reveal = steps.at(-1);
    expect(reveal?.blend).toBe("source-in");
    expect(reveal?.args).toEqual([
      fakes.blurred,
      dx / 4,
      dy / 4,
      dw / 4,
      dh / 4,
      0,
      0,
      dw,
      dh,
    ]);
    expect(blurLayers).not.toHaveBeenCalled();
  });

  it("desenfoque sin copia: no pinta nada (el trazo se guarda igual)", () => {
    const live = createContext("live");
    const s = stroke("blur", 1);
    const renderer = createLiveRenderer(asCtx(live), s);
    renderer.update(s.points, s.points);
    expect(live.calls).toEqual([]);
    expect(fakes.canvases).toEqual([]);
  });
});
