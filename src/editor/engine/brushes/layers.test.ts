import { describe, expect, it } from "vitest";
import type { BrushPresetId } from "../../model/types";
import { splitStrokeLayers, strokeLayers } from "./layers";

const stroke = (id: string, brush: BrushPresetId) => ({ id, brush });
const ids = (strokes: readonly { id: string }[]) => strokes.map((s) => s.id);

describe("strokeLayers", () => {
  it("el resaltador va en su capa, el borrador en las dos y el resto en la de pintura", () => {
    expect(strokeLayers({ brush: "highlighter" })).toEqual({
      paint: false,
      highlight: true,
    });
    expect(strokeLayers({ brush: "eraserHard" })).toEqual({
      paint: true,
      highlight: true,
    });
    expect(strokeLayers({ brush: "eraserSoft" })).toEqual({
      paint: true,
      highlight: true,
    });
    for (const brush of [
      "pen",
      "marker",
      "pencil",
      "chalk",
      "airbrush",
      "spray",
    ] as const) {
      expect(strokeLayers({ brush })).toEqual({
        paint: true,
        highlight: false,
      });
    }
  });
});

describe("splitStrokeLayers", () => {
  it("reparte los trazos manteniendo el orden", () => {
    const { paint, highlight } = splitStrokeLayers([
      stroke("tinta", "pen"),
      stroke("goma1", "eraserHard"),
      stroke("resalta", "highlighter"),
      stroke("goma2", "eraserSoft"),
      stroke("tiza", "chalk"),
    ]);
    expect(ids(paint)).toEqual(["tinta", "goma1", "goma2", "tiza"]);
    // goma1 es anterior al primer resaltador: no tiene nada que borrar.
    expect(ids(highlight)).toEqual(["resalta", "goma2"]);
  });

  it("sin resaltador, su capa queda vacía (aunque haya borradores)", () => {
    const { paint, highlight } = splitStrokeLayers([
      stroke("a", "pen"),
      stroke("b", "eraserHard"),
    ]);
    expect(ids(paint)).toEqual(["a", "b"]);
    expect(highlight).toEqual([]);
  });

  it("añadir un trazo solo alarga las listas (el raster se actualiza por partes)", () => {
    const strokes = [
      stroke("a", "eraserHard"),
      stroke("b", "highlighter"),
      stroke("c", "pen"),
    ];
    const before = splitStrokeLayers(strokes);
    const after = splitStrokeLayers([...strokes, stroke("d", "eraserSoft")]);
    expect(ids(after.paint).slice(0, before.paint.length)).toEqual(
      ids(before.paint)
    );
    expect(ids(after.highlight).slice(0, before.highlight.length)).toEqual(
      ids(before.highlight)
    );
    expect(ids(after.highlight)).toEqual(["b", "d"]);
  });
});
