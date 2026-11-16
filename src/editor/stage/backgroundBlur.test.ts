import { beforeEach, describe, expect, it, vi } from "vitest";
import { blurLayers, type BlurSource } from "../engine/brushes/blur";
import type { StrokeEntry } from "../model/types";
import { createBackgroundBlur } from "./backgroundBlur";

/**
 * jsdom no tiene canvas 2D: se usan canvas falsos que apuntan lo que se hace
 * en ellos, con el modo de fusión y la opacidad de cada paso.
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
  save: () => void;
  restore: () => void;
  clearRect: () => void;
  drawImage: (source: { id?: number; name?: string }) => void;
}

const fakes = vi.hoisted(() => ({
  canvases: [] as unknown[],
  blurred: { name: "fondo desenfocado" },
}));

vi.mock("../../lib/canvas", () => {
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
      save: () => stack.push([ctx.globalAlpha, ctx.globalCompositeOperation]),
      restore: () => {
        [ctx.globalAlpha, ctx.globalCompositeOperation] = stack.pop() ?? [
          1,
          "source-over",
        ];
      },
      clearRect: () => canvas.steps.push("clear"),
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

vi.mock("../engine/brushes/blur", () => ({
  blurLayers: vi.fn(() => fakes.blurred),
  revealBlurred: (ctx: FakeContext, blurred: { name: string }) =>
    ctx.canvas.steps.push(`reveal ${blurred.name}`),
}));

// La máscara "pinta" apuntando el id del trazo.
vi.mock("../engine/brushes/paint", () => ({
  paintBlurMask: (ctx: FakeContext, stroke: { id: string }) =>
    ctx.canvas.steps.push(`mask ${stroke.id}`),
  paintStroke: () => {},
}));

const stroke = (id: string) => ({ id }) as unknown as StrokeEntry;
const SIZE = { width: 400, height: 300 };
const BACKGROUND: BlurSource[] = [{ color: "white" }];

const create = () => {
  const getBackground = vi.fn(() => BACKGROUND);
  return {
    getBackground,
    blur: createBackgroundBlur(SIZE, { getBackground }),
  };
};

/** Lo último que se hizo en lo que se muestra (desde el último "clear"). */
const lastCompose = (view: unknown) => {
  const { steps } = view as FakeCanvas;
  return steps.slice(steps.lastIndexOf("clear"));
};

beforeEach(() => {
  fakes.canvases.length = 0;
  vi.mocked(blurLayers).mockClear();
});

describe("createBackgroundBlur", () => {
  it("sin trazos de desenfoque no crea ningún canvas ni desenfoca nada", () => {
    const { blur } = create();
    blur.sync([]);
    blur.invalidateBackground();
    blur.refresh();
    expect(blur.view).toBeNull();
    expect(fakes.canvases).toEqual([]);
    expect(blurLayers).not.toHaveBeenCalled();
  });

  it("muestra el fondo desenfocado recortado con la máscara de los trazos", () => {
    const { blur, getBackground } = create();
    blur.sync([stroke("a")]);

    expect(blurLayers).toHaveBeenCalledTimes(1);
    expect(vi.mocked(blurLayers).mock.calls[0].slice(0, 2)).toEqual([
      BACKGROUND,
      SIZE,
    ]);
    expect(getBackground).toHaveBeenCalledTimes(1);
    const [mask] = fakes.canvases as FakeCanvas[];
    expect(mask.steps).toEqual(["mask a"]);
    expect(blur.view).not.toBeNull();
    expect(lastCompose(blur.view)).toEqual([
      "clear",
      `draw canvas${mask.id} source-over 1`,
      "reveal fondo desenfocado",
    ]);
  });

  it("un trazo nuevo solo actualiza la máscara: el fondo no se vuelve a desenfocar", () => {
    const { blur } = create();
    blur.sync([stroke("a")]);
    blur.sync([stroke("a"), stroke("b")]);
    expect(blurLayers).toHaveBeenCalledTimes(1);
    const [mask] = fakes.canvases as FakeCanvas[];
    expect(mask.steps).toEqual(["mask a", "mask b"]);
  });

  it("al cambiar el fondo se vuelve a desenfocar, sin repintar los trazos", () => {
    const { blur } = create();
    blur.sync([stroke("a")]);
    blur.invalidateBackground();
    expect(blurLayers).toHaveBeenCalledTimes(2);
    // La copia anterior se reutiliza para la nueva.
    expect(vi.mocked(blurLayers).mock.calls[1][2]).toEqual({
      into: fakes.blurred,
    });
    const [mask] = fakes.canvases as FakeCanvas[];
    expect(mask.steps).toEqual(["mask a"]);
    expect(lastCompose(blur.view).at(-1)).toBe("reveal fondo desenfocado");
  });

  it("un borrador en curso se resta de la máscara mientras se arrastra", () => {
    const { blur } = create();
    blur.sync([stroke("a")]);
    expect(blur.needsLiveRefresh).toBe(false);

    const live = { name: "trazo en curso" } as unknown as HTMLCanvasElement;
    blur.setLiveEraser({ canvas: live, opacity: 0.5 });
    expect(blur.needsLiveRefresh).toBe(true);
    blur.refresh();
    const [mask] = fakes.canvases as FakeCanvas[];
    expect(lastCompose(blur.view)).toEqual([
      "clear",
      `draw canvas${mask.id} source-over 1`,
      "draw trazo en curso destination-out 0.5",
      "reveal fondo desenfocado",
    ]);

    // Al soltarlo (o cancelarlo) lo que se muestra vuelve a ser la máscara.
    blur.setLiveEraser(null);
    expect(blur.needsLiveRefresh).toBe(false);
    expect(lastCompose(blur.view)).toHaveLength(3);
    expect(blurLayers).toHaveBeenCalledTimes(1);
  });

  it("al deshacer todos los trazos de desenfoque deja de mostrarse", () => {
    const { blur } = create();
    blur.sync([stroke("a")]);
    blur.sync([]);
    expect(blur.view).toBeNull();
    expect(blur.needsLiveRefresh).toBe(false);
    blur.sync([stroke("b")]);
    expect(blur.view).not.toBeNull();
  });

  it("usa el búfer de trazo compartido si se le da uno", () => {
    const shared = { name: "búfer compartido" } as unknown as HTMLCanvasElement;
    const getScratch = vi.fn(() => shared);
    const blur = createBackgroundBlur(SIZE, {
      getBackground: () => BACKGROUND,
      getScratch,
    });
    blur.sync([stroke("a")]);
    expect(getScratch).toHaveBeenCalled();
    // Solo la máscara y lo que se muestra: ningún búfer propio.
    expect(fakes.canvases).toHaveLength(2);
  });
});
