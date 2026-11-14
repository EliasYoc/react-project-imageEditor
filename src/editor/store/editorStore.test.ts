import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_TEXT_STYLE,
  MAX_GRADIENT_STOPS,
  createStroke,
} from "../model/factories";
import type { StrokeEntry, TextElement } from "../model/types";
import { MAX_HISTORY, createEditorStore } from "./editorStore";
import {
  selectBrushColor,
  selectCanRedo,
  selectCanUndo,
  selectCurrentBrush,
  selectElements,
  selectSelectedElement,
  selectSelectedText,
  selectStrokes,
} from "./selectors";

const stroke = (size = 10): StrokeEntry => ({
  ...createStroke({
    brush: "marker",
    settings: { size, opacity: 1, stabilizer: 0 },
    color: { r: 0, g: 0, b: 0, a: 1 },
  }),
  points: [{ x: 0, y: 0, pressure: 0.5 }],
});

const emptyBackground = { source: null, preview: null, mimeType: null };

let store: ReturnType<typeof createEditorStore>;
const state = () => store.getState();
const sizes = () => selectStrokes(state()).map((entry) => entry.size);

beforeEach(() => {
  store = createEditorStore();
});

describe("estado inicial y modo", () => {
  it("empieza en la pantalla de inicio, sin historial", () => {
    expect(state().mode).toBe("home");
    expect(state().status).toBe("idle");
    expect(state().log).toEqual([]);
    expect(state().selectedElementId).toBeNull();
    expect(selectCanUndo(state())).toBe(false);
    expect(selectCanRedo(state())).toBe(false);
  });

  it("setMode y setStatus cambian el modo y el estado", () => {
    state().setMode("text");
    state().setStatus("exporting");
    expect(state().mode).toBe("text");
    expect(state().status).toBe("exporting");
  });
});

describe("fondo", () => {
  it("loadBackground cambia el tamaño del lienzo y empieza de cero, sin historial", () => {
    state().addStroke(stroke());
    state().addText();
    state().undo();
    state().loadBackground({
      ...emptyBackground,
      mimeType: "image/jpeg",
      size: { width: 800, height: 600 },
    });
    expect(state().canvasSize).toEqual({ width: 800, height: 600 });
    expect(state().background.mimeType).toBe("image/jpeg");
    expect(state().log).toEqual([]);
    expect(state().selectedElementId).toBeNull();
    expect(selectCanUndo(state())).toBe(false);
    expect(selectCanRedo(state())).toBe(false);
  });

  it("setBackgroundImage conserva el dibujo", () => {
    state().addStroke(stroke());
    state().setBackgroundImage({ ...emptyBackground, mimeType: "image/png" });
    expect(state().background.mimeType).toBe("image/png");
    expect(state().log).toHaveLength(1);
  });
});

describe("historial", () => {
  it("addStroke agrega trazos en orden", () => {
    state().addStroke(stroke(1));
    state().addStroke(stroke(2));
    expect(sizes()).toEqual([1, 2]);
  });

  it("undo quita el último cambio y no falla con el historial vacío", () => {
    state().undo();
    state().addStroke(stroke(1));
    state().addStroke(stroke(2));
    state().undo();
    expect(sizes()).toEqual([1]);
  });

  it("redo vuelve a aplicar lo deshecho, en orden", () => {
    state().addStroke(stroke(1));
    state().addStroke(stroke(2));
    state().addStroke(stroke(3));
    state().undo();
    state().undo();
    expect(sizes()).toEqual([1]);
    state().redo();
    expect(sizes()).toEqual([1, 2]);
    state().redo();
    state().redo(); // no queda nada que rehacer: no hace nada
    expect(sizes()).toEqual([1, 2, 3]);
  });

  it("un cambio nuevo después de deshacer ya no permite rehacer", () => {
    state().addStroke(stroke(1));
    state().undo();
    expect(selectCanRedo(state())).toBe(true);
    state().addStroke(stroke(2));
    expect(selectCanRedo(state())).toBe(false);
    expect(sizes()).toEqual([2]);
  });

  it("undo de un elemento seleccionado limpia la selección", () => {
    state().addStroke(stroke());
    state().addText();
    state().undo();
    expect(state().selectedElementId).toBeNull();
    expect(state().log).toHaveLength(1);
  });

  it("clearLog borra todo y se puede deshacer", () => {
    state().addText();
    state().addStroke(stroke());
    const before = state().log;
    state().clearLog();
    expect(state().log).toEqual([]);
    expect(state().selectedElementId).toBeNull();

    state().undo();
    expect(state().log).toEqual(before);
  });

  it("clearLog sin nada que borrar no crea un paso del historial", () => {
    state().clearLog();
    expect(selectCanUndo(state())).toBe(false);
  });

  it("deshacer un trazo conserva lo que se escribió en un texto después", () => {
    const id = state().addText();
    state().addStroke(stroke());
    state().updateElement(id, { text: "Hola" });

    state().undo(); // quita el trazo
    expect(selectSelectedText(state())).toMatchObject({ text: "Hola" });

    state().redo(); // y lo devuelve, sin perder el texto
    expect(state().log).toHaveLength(2);
    expect(selectSelectedText(state())).toMatchObject({ text: "Hola" });
  });

  it(`guarda como máximo ${MAX_HISTORY} pasos`, () => {
    for (let i = 0; i < MAX_HISTORY + 5; i++) state().addStroke(stroke(i));
    expect(state().past).toHaveLength(MAX_HISTORY);
  });
});

describe("elementos", () => {
  it("addText crea un texto con el estilo por defecto y lo selecciona", () => {
    const id = state().addText();
    const text = selectSelectedText(state());
    expect(text).toMatchObject({ id, text: "", ...DEFAULT_TEXT_STYLE });
    expect(state().selectedElementId).toBe(id);
  });

  it("cada elemento nuevo queda por encima de los anteriores", () => {
    state().addText();
    state().addImage("blob:imagen");
    const [first, second] = selectElements(state());
    expect(second.zIndex).toBeGreaterThan(first.zIndex);
    expect(second).toMatchObject({
      whatTask: "draggableImage",
      imageUrl: "blob:imagen",
    });
  });

  it("updateElement cambia solo ese elemento y sin mutar el anterior", () => {
    const a = state().addText();
    const b = state().addText();
    const before = state().log;
    state().updateElement(a, { fontWeight: 900, text: "Hola" });

    expect(state().log).not.toBe(before);
    expect(before[0]).toMatchObject({ fontWeight: 500, text: "" });
    const [textA, textB] = selectElements(state()) as TextElement[];
    expect(textA).toMatchObject({ id: a, fontWeight: 900, text: "Hola" });
    expect(textB).toBe(before[1]);
    expect(textB.id).toBe(b);
  });

  it("updateElement no crea un paso del historial", () => {
    const id = state().addText();
    const pastLength = state().past.length;
    state().updateElement(id, { text: "Hola" });
    expect(state().past).toHaveLength(pastLength);
  });

  it("selectElement trae el elemento al frente y null deselecciona", () => {
    const a = state().addText();
    state().addText();
    state().selectElement(a);

    const [textA, textB] = selectElements(state());
    expect(state().selectedElementId).toBe(a);
    expect(textA.zIndex).toBeGreaterThan(textB.zIndex);

    state().selectElement(null);
    expect(selectSelectedElement(state())).toBeNull();
  });

  it("seleccionar el elemento que ya está al frente no cambia su zIndex", () => {
    state().addText();
    const b = state().addText();
    const zBefore = selectElements(state())[1].zIndex;
    state().selectElement(null);
    state().selectElement(b);
    expect(selectElements(state())[1].zIndex).toBe(zBefore);
  });
});

describe("pinceles", () => {
  it("empieza con la Pluma y cada preset recuerda sus propios ajustes", () => {
    expect(state().brush.presetId).toBe("pen");
    state().setBrushSize(7);
    state().setBrushOpacity(0.5);
    state().setBrushStabilizer(0.8);

    state().setBrushPreset("chalk");
    expect(selectCurrentBrush(state()).size).toBe(40); // el de la Tiza

    state().setBrushPreset("pen");
    expect(selectCurrentBrush(state())).toEqual({
      size: 7,
      opacity: 0.5,
      stabilizer: 0.8,
    });
  });

  it("el color es el mismo para todos los pinceles", () => {
    state().setBrushColor({ r: 1, g: 2, b: 3, a: 1 });
    state().setBrushPreset("pencil");
    expect(selectBrushColor(state())).toEqual({ r: 1, g: 2, b: 3, a: 1 });
  });

  it("recuerda el último pincel y el último borrador para alternar entre ambos", () => {
    state().setBrushPreset("pencil");
    state().setBrushPreset("eraserSoft");
    state().selectDrawBrush();
    expect(state().brush.presetId).toBe("pencil");
    state().selectEraser();
    expect(state().brush.presetId).toBe("eraserSoft");
  });

  it("createStroke copia el pincel: cambiarlo después no altera el trazo", () => {
    const color = { r: 1, g: 2, b: 3, a: 1 };
    const created = createStroke({
      brush: "spray",
      settings: { size: 20, opacity: 0.6, stabilizer: 0 },
      color,
      hasPressure: true,
    });
    color.r = 200;
    expect(created).toMatchObject({
      whatTask: "stroke",
      brush: "spray",
      size: 20,
      opacity: 0.6,
      hasPressure: true,
      color: { r: 1 },
      points: [],
    });
    expect(created.id).toEqual(expect.any(String));
    expect(created.seed).toEqual(expect.any(Number));
  });
});

describe("gradiente", () => {
  it(`permite hasta ${MAX_GRADIENT_STOPS} paradas`, () => {
    for (let i = 0; i < 10; i++) state().addGradientStop();
    expect(state().gradient.stops).toHaveLength(MAX_GRADIENT_STOPS);
  });

  it("nunca deja el gradiente sin paradas", () => {
    const [first, second] = state().gradient.stops;
    state().removeGradientStop(first.id);
    state().removeGradientStop(second.id);
    expect(state().gradient.stops).toHaveLength(1);
  });

  it("cambia posición, color y ángulo", () => {
    const [first] = state().gradient.stops;
    state().setGradientStopOffset(first.id, 42);
    state().setGradientStopColor(first.id, { r: 9, g: 9, b: 9, a: 1 });
    state().setGradientAngle(90);
    expect(state().gradient.stops[0]).toMatchObject({
      offset: 42,
      color: { r: 9, g: 9, b: 9, a: 1 },
    });
    expect(state().gradient.angle).toBe(90);
  });
});

describe("selectores", () => {
  it("selectElements y selectStrokes separan el log y devuelven la misma referencia si no cambia", () => {
    state().addStroke(stroke());
    state().addText();
    const elements = selectElements(state());
    const strokes = selectStrokes(state());
    expect(elements).toHaveLength(1);
    expect(strokes).toHaveLength(1);
    expect(selectElements(state())).toBe(elements);
    expect(selectStrokes(state())).toBe(strokes);
  });

  it("selectSelectedText devuelve null si lo seleccionado es una imagen", () => {
    state().addImage("blob:imagen");
    expect(selectSelectedElement(state())).not.toBeNull();
    expect(selectSelectedText(state())).toBeNull();
  });
});
