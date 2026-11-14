import { beforeEach, describe, expect, it } from "vitest";
import type { Size, StrokeEntry } from "../model/types";
import { PaintRaster } from "./PaintRaster";

/**
 * jsdom no tiene canvas 2D: se usan canvas falsos cuyo "contenido" es la lista
 * de ids de trazos pintados. Así se puede comprobar qué hay en el raster.
 */
interface FakeCanvas {
  width: number;
  height: number;
  content: string[];
  getContext: () => FakeContext;
}
interface FakeContext {
  canvas: FakeCanvas;
  clearRect: () => void;
  drawImage: (source: FakeCanvas) => void;
}

const createFakeCanvas = ({ width, height }: Size): FakeCanvas => {
  const canvas: FakeCanvas = {
    width,
    height,
    content: [],
    getContext: () => ctx,
  };
  const ctx: FakeContext = {
    canvas,
    clearRect: () => {
      canvas.content = [];
    },
    drawImage: (source) => {
      canvas.content = [...source.content];
    },
  };
  return canvas;
};

const stroke = (id: string) =>
  ({
    id,
    whatTask: "stroke",
    brush: "normal",
    points: [],
  }) as unknown as StrokeEntry;
const strokes = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => stroke(`s${from + i}`));

let painted: string[];
let raster: PaintRaster;
const content = () => (raster.canvas as unknown as FakeCanvas).content;

beforeEach(() => {
  painted = [];
  raster = new PaintRaster(
    { width: 10, height: 10 },
    {
      createCanvas: (size) =>
        createFakeCanvas(size) as unknown as HTMLCanvasElement,
      paint: (ctx, entry) => {
        painted.push(entry.id);
        (ctx as unknown as FakeContext).canvas.content.push(entry.id);
      },
      checkpointInterval: 5,
      maxCheckpoints: 2,
    }
  );
});

describe("PaintRaster.sync", () => {
  it("sin cambios no pinta nada", () => {
    const list = strokes(0, 3);
    raster.sync(list);
    painted = [];
    expect(raster.sync(list)).toBe("unchanged");
    expect(painted).toEqual([]);
  });

  it("con trazos nuevos al final solo pinta los nuevos", () => {
    const list = strokes(0, 3);
    raster.sync(list);
    painted = [];
    expect(raster.sync([...list, stroke("nuevo")])).toBe("appended");
    expect(painted).toEqual(["nuevo"]);
    expect(content()).toEqual(["s0", "s1", "s2", "nuevo"]);
  });

  it("al deshacer vuelve a la copia más cercana y pinta solo lo que falta", () => {
    const list = strokes(0, 12); // copias en 5 y 10
    raster.sync(list);
    expect(raster.checkpointCounts).toEqual([5, 10]);

    painted = [];
    expect(raster.sync(list.slice(0, 8))).toBe("restored");
    expect(painted).toEqual(["s5", "s6", "s7"]);
    expect(content()).toEqual(list.slice(0, 8).map((s) => s.id));
  });

  it("sin copia válida repinta desde cero", () => {
    const list = strokes(0, 4);
    raster.sync(list);
    painted = [];
    expect(raster.sync(list.slice(0, 2))).toBe("redrawn");
    expect(painted).toEqual(["s0", "s1"]);
  });

  it("deshacer 'Borrar todo' usa la última copia en vez de repintar todo", () => {
    const list = strokes(0, 12);
    raster.sync(list);
    raster.sync([]);
    expect(content()).toEqual([]);

    painted = [];
    expect(raster.sync(list)).toBe("restored");
    expect(painted).toEqual(["s10", "s11"]);
    expect(content()).toEqual(list.map((s) => s.id));
  });

  it("una copia de otra rama del historial no se usa", () => {
    const list = strokes(0, 6); // copia en 5
    raster.sync(list);
    // Deshacer hasta 3 y dibujar otros trazos: la copia de 5 ya no sirve.
    const branch = [...list.slice(0, 3), ...strokes(100, 103)];
    raster.sync(branch);
    expect(content()).toEqual(branch.map((s) => s.id));
  });

  it("guarda como máximo `maxCheckpoints` copias", () => {
    raster.sync(strokes(0, 21)); // copias en 5, 10, 15, 20
    expect(raster.checkpointCounts).toEqual([15, 20]);
  });
});
