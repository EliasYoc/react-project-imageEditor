import { beforeEach, describe, expect, it, vi } from "vitest";
import { blurLayers } from "../../../editor/engine/brushes/blur";
import { paintFill } from "../../../editor/engine/fill/paintFill";
import type { EditorStore } from "../../../editor/store/editorStore";
import {
  createDocumentCompositor,
  type DrawBackground,
} from "./documentCompositor";
import { renderElements } from "./renderElements";

/**
 * jsdom no tiene canvas 2D: se usan canvas falsos que apuntan lo que se hace
 * en ellos, con el modo de fusión y la opacidad de cada paso (como en
 * backgroundBlur.test.ts).
 */
interface FakeCanvas {
  id: number;
  width: number;
  height: number;
  steps: string[];
  getContext: () => FakeContext;
}
interface FakeContext {
  canvas: FakeCanvas;
  globalAlpha: number;
  globalCompositeOperation: string;
  fillStyle: string;
  save: () => void;
  restore: () => void;
  scale: () => void;
  setTransform: () => void;
  clearRect: () => void;
  fillRect: () => void;
  drawImage: (source: { id?: number; name?: string }) => void;
}

const fakes = vi.hoisted(() => ({
  canvases: [] as unknown[],
  blurred: { name: "fondo desenfocado" },
  elements: { name: "elementos" },
  layers: {
    paint: [] as { id: string }[],
    highlight: [] as { id: string }[],
    blur: [] as { id: string }[],
  },
  elementList: [] as { id: string }[],
}));

vi.mock("../../../lib/canvas", () => {
  const createCanvas = ({
    width,
    height,
  }: {
    width: number;
    height: number;
  }) => {
    const canvas: FakeCanvas = {
      id: fakes.canvases.length,
      width,
      height,
      steps: [],
      getContext: () => ctx,
    };
    const stack: [number, string][] = [];
    const ctx: FakeContext = {
      canvas,
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      fillStyle: "",
      save: () => stack.push([ctx.globalAlpha, ctx.globalCompositeOperation]),
      restore: () => {
        [ctx.globalAlpha, ctx.globalCompositeOperation] = stack.pop() ?? [
          1,
          "source-over",
        ];
      },
      scale: () => {},
      setTransform: () => {},
      clearRect: () => canvas.steps.push("clear"),
      fillRect: () => canvas.steps.push(`rect ${ctx.fillStyle}`),
      drawImage: (source) =>
        canvas.steps.push(
          `draw ${source.name ?? `canvas${source.id}`} ${ctx.globalCompositeOperation} ${ctx.globalAlpha}`
        ),
    };
    fakes.canvases.push(canvas);
    return canvas;
  };
  return {
    createCanvas,
    get2dContext: (canvas: FakeCanvas) => canvas.getContext(),
  };
});

vi.mock("../../../editor/engine/brushes/blur", () => ({
  blurLayers: vi.fn(() => fakes.blurred),
  revealBlurred: (ctx: FakeContext, blurred: { name: string }) =>
    ctx.canvas.steps.push(`reveal ${blurred.name}`),
}));

// Los trazos "pintan" apuntando su id.
vi.mock("../../../editor/engine/brushes/paint", () => ({
  paintBlurMask: (ctx: FakeContext, stroke: { id: string }) =>
    ctx.canvas.steps.push(`mask ${stroke.id}`),
  paintStroke: (ctx: FakeContext, stroke: { id: string }) =>
    ctx.canvas.steps.push(`stroke ${stroke.id}`),
}));

vi.mock("../../../editor/engine/fill/paintFill", () => ({
  paintFill: vi.fn((ctx: FakeContext) => ctx.canvas.steps.push("fill")),
}));

vi.mock("../../../editor/store/selectors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../editor/store/selectors")>()),
  selectStrokeLayers: () => fakes.layers,
  selectElements: () => fakes.elementList,
}));

vi.mock("./renderElements", () => ({
  renderElements: vi.fn(async () => fakes.elements),
}));

const DOC = { width: 400, height: 300 };
const OUTPUT = { width: 800, height: 600 };

const stateWith = ({
  hasPhoto = true,
  hasVideo = false,
  fill = null,
}: { hasPhoto?: boolean; hasVideo?: boolean; fill?: string | null } = {}) =>
  ({
    canvasSize: DOC,
    photo: {
      source: hasPhoto ? { name: "foto" } : null,
      video: hasVideo ? { element: { name: "video" } } : null,
    },
    backdrop: { fill, opacity: 0.5, blend: "overlay" },
  }) as unknown as EditorStore;

const paintWhite = vi.fn<DrawBackground>((ctx) => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 1, 1);
});

const canvasAt = (index: number) => fakes.canvases[index] as FakeCanvas;
const steps = (canvas: unknown) => (canvas as FakeCanvas).steps;

beforeEach(() => {
  fakes.canvases.length = 0;
  fakes.layers = { paint: [], highlight: [], blur: [] };
  fakes.elementList = [];
  vi.mocked(blurLayers).mockClear();
  vi.mocked(paintFill).mockClear();
  vi.mocked(renderElements).mockClear();
  paintWhite.mockClear();
});

describe("createDocumentCompositor", () => {
  it("un documento vacío solo pinta el fondo", async () => {
    const compositor = await createDocumentCompositor(
      stateWith({ hasPhoto: false }),
      OUTPUT
    );
    const result = compositor.render(paintWhite);

    // Solo el resultado y el búfer de trazo: ninguna capa.
    expect(fakes.canvases).toHaveLength(2);
    expect(result).toMatchObject(OUTPUT);
    expect(steps(result)).toEqual(["rect white"]);
    expect(paintWhite.mock.calls[0][1]).toEqual(OUTPUT);
    expect(blurLayers).not.toHaveBeenCalled();
    expect(renderElements).not.toHaveBeenCalled();
  });

  it("compone las capas en el orden del lienzo", async () => {
    fakes.layers = {
      paint: [{ id: "p" }],
      highlight: [{ id: "h" }],
      blur: [{ id: "b" }],
    };
    fakes.elementList = [{ id: "texto" }];
    const compositor = await createDocumentCompositor(
      stateWith({ fill: "red" }),
      OUTPUT
    );
    const [, scratch, fill, mask, highlight, overlay] =
      fakes.canvases as FakeCanvas[];
    expect(steps(fill)).toEqual(["fill"]);
    expect(steps(mask)).toEqual(["mask b"]);
    expect(steps(highlight)).toEqual(["stroke h"]);
    // Pintura y elementos comparten capa: los elementos van encima.
    expect(steps(overlay)).toEqual([
      "stroke p",
      "draw elementos source-over 1",
    ]);
    expect(vi.mocked(renderElements).mock.calls[0]).toEqual([
      fakes.elementList,
      DOC,
      OUTPUT,
    ]);

    const result = compositor.render(paintWhite);
    expect(steps(result)).toEqual([
      "rect white",
      `draw canvas${fill.id} overlay 0.5`,
      `draw canvas${scratch.id} source-over 1`,
      `draw canvas${highlight.id} multiply 1`,
      `draw canvas${overlay.id} source-over 1`,
    ]);
    // El desenfoque sale del fondo con su capa de color, sin lo de encima.
    expect(vi.mocked(blurLayers).mock.calls[0].slice(0, 2)).toEqual([
      [{ image: result }],
      OUTPUT,
    ]);
    expect(steps(scratch)).toEqual([
      "clear",
      `draw canvas${mask.id} source-over 1`,
      "reveal fondo desenfocado",
    ]);
  });

  it("lo fijo se pinta una vez; cada fotograma repite solo lo que depende del fondo", async () => {
    fakes.layers = {
      paint: [{ id: "p" }],
      highlight: [{ id: "h" }],
      blur: [{ id: "b" }],
    };
    fakes.elementList = [{ id: "texto" }];
    const compositor = await createDocumentCompositor(
      stateWith({ fill: "red" }),
      OUTPUT
    );
    const created = fakes.canvases.length;
    const [, , fill, mask, highlight, overlay] = fakes.canvases as FakeCanvas[];
    const fixed = [fill, mask, highlight, overlay].map((canvas) => [
      ...canvas.steps,
    ]);

    const first = compositor.render(paintWhite);
    const second = compositor.render(paintWhite);

    // El mismo canvas, sin crear ninguno más ni repintar las capas.
    expect(second).toBe(first);
    expect(fakes.canvases).toHaveLength(created);
    expect(
      [fill, mask, highlight, overlay].map((canvas) => canvas.steps)
    ).toEqual(fixed);
    expect(paintFill).toHaveBeenCalledTimes(1);
    expect(renderElements).toHaveBeenCalledTimes(1);

    // Por fotograma: el fondo y su desenfoque, reutilizando la copia.
    expect(paintWhite).toHaveBeenCalledTimes(2);
    expect(blurLayers).toHaveBeenCalledTimes(2);
    expect(vi.mocked(blurLayers).mock.calls[1][2]).toEqual({
      into: fakes.blurred,
    });
    expect(steps(first)).toHaveLength(10);
  });

  it("sin foto, la capa de color se pinta en modo normal", async () => {
    const compositor = await createDocumentCompositor(
      stateWith({ hasPhoto: false, fill: "red" }),
      OUTPUT
    );
    const result = compositor.render(paintWhite);
    expect(steps(result)).toEqual([
      "rect white",
      `draw canvas${canvasAt(2).id} source-over 0.5`,
    ]);
  });

  it("sobre un video, la capa de color se funde como sobre una foto", async () => {
    const compositor = await createDocumentCompositor(
      stateWith({ hasPhoto: false, hasVideo: true, fill: "red" }),
      OUTPUT
    );
    expect(steps(compositor.render(paintWhite))).toEqual([
      "rect white",
      `draw canvas${canvasAt(2).id} overlay 0.5`,
    ]);
  });

  it("los textos e imágenes van en su capa aunque no haya pintura", async () => {
    fakes.elementList = [{ id: "texto" }];
    const compositor = await createDocumentCompositor(stateWith(), OUTPUT);
    const overlay = canvasAt(2);
    expect(steps(overlay)).toEqual(["draw elementos source-over 1"]);
    expect(steps(compositor.render(paintWhite))).toEqual([
      "rect white",
      `draw canvas${overlay.id} source-over 1`,
    ]);
  });
});
