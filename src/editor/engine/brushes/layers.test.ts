import { describe, expect, it } from "vitest";
import type { BrushPresetId } from "../../model/types";
import { splitStrokeLayers, strokeLayers } from "./layers";

const stroke = (id: string, brush: BrushPresetId) => ({ id, brush });
const ids = (strokes: readonly { id: string }[]) => strokes.map((s) => s.id);

describe("strokeLayers", () => {
  it("el resaltador va en su capa, el borrador en todas y el resto en la de pintura", () => {
    expect(strokeLayers({ brush: "highlighter" })).toEqual({
      paint: false,
      highlight: true,
      blur: false,
    });
    expect(strokeLayers({ brush: "eraserHard" })).toEqual({
      paint: true,
      highlight: true,
      blur: true,
    });
    expect(strokeLayers({ brush: "eraserSoft" })).toEqual({
      paint: true,
      highlight: true,
      blur: true,
    });
    for (const brush of [
      "pen",
      "marker",
      "pencil",
      "chalk",
      "airbrush",
      "spray",
      "calligraphy",
      "neon",
      "shapes",
    ] as const) {
      expect(strokeLayers({ brush })).toEqual({
        paint: true,
        highlight: false,
        blur: false,
      });
    }
  });

  it("el desenfoque afecta a todas las capas", () => {
    expect(strokeLayers({ brush: "blur" })).toEqual({
      paint: true,
      highlight: true,
      blur: true,
    });
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
      stroke("d", "blur"),
    ];
    const before = splitStrokeLayers(strokes);
    const after = splitStrokeLayers([...strokes, stroke("e", "eraserSoft")]);
    for (const layer of ["paint", "highlight", "blur"] as const) {
      expect(ids(after[layer]).slice(0, before[layer].length)).toEqual(
        ids(before[layer])
      );
    }
    expect(ids(after.highlight)).toEqual(["b", "d", "e"]);
    expect(ids(after.blur)).toEqual(["d", "e"]);
  });

  it("sin desenfoque, su máscara queda vacía (aunque haya borradores)", () => {
    const { blur } = splitStrokeLayers([
      stroke("a", "pen"),
      stroke("b", "eraserHard"),
      stroke("c", "highlighter"),
    ]);
    expect(blur).toEqual([]);
  });

  it("la máscara del desenfoque lleva sus trazos y los borradores posteriores", () => {
    const { blur } = splitStrokeLayers([
      stroke("goma1", "eraserHard"),
      stroke("borroso1", "blur"),
      stroke("tinta", "pen"),
      stroke("goma2", "eraserSoft"),
      stroke("borroso2", "blur"),
    ]);
    // goma1 es anterior al primer desenfoque: no tiene nada que quitar.
    expect(ids(blur)).toEqual(["borroso1", "goma2", "borroso2"]);
  });

  it("el desenfoque solo entra en una capa de trazos si ya hay algo pintado en ella", () => {
    const { paint, highlight } = splitStrokeLayers([
      stroke("goma", "eraserHard"),
      // Solo hay un borrador: nada que desenfocar en ninguna capa.
      stroke("borroso1", "blur"),
      stroke("tinta", "pen"),
      // Ya hay pintura, pero nada resaltado.
      stroke("borroso2", "blur"),
      stroke("resalta", "highlighter"),
      stroke("borroso3", "blur"),
    ]);
    expect(ids(paint)).toEqual(["goma", "tinta", "borroso2", "borroso3"]);
    expect(ids(highlight)).toEqual(["resalta", "borroso3"]);
  });
});
