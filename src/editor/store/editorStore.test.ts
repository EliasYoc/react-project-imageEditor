import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TEXT_STYLE, MAX_GRADIENT_STOPS } from "../model/factories";
import type { PaintingEntry, TextElement } from "../model/types";
import { createEditorStore } from "./editorStore";
import {
  selectCurrentBrush,
  selectElements,
  selectSelectedElement,
  selectSelectedText,
} from "./selectors";

const stroke = (size = 10): PaintingEntry => ({
  whatTask: "painting",
  data: [{ coordX: 0, coordY: 0 }],
  color: { r: 0, g: 0, b: 0, a: 1 },
  size,
  globalCompositeOperation: "source-over",
});

let store: ReturnType<typeof createEditorStore>;
const state = () => store.getState();

beforeEach(() => {
  store = createEditorStore();
});

describe("estado inicial y modo", () => {
  it("empieza en la pantalla de inicio, sin historial", () => {
    expect(state().mode).toBe("home");
    expect(state().status).toBe("idle");
    expect(state().log).toEqual([]);
    expect(state().selectedElementId).toBeNull();
  });

  it("setMode y setStatus cambian el modo y el estado", () => {
    state().setMode("text");
    state().setStatus("exporting");
    expect(state().mode).toBe("text");
    expect(state().status).toBe("exporting");
  });
});

describe("fondo", () => {
  it("loadBackground cambia el tamaño del lienzo y empieza de cero", () => {
    state().addLogEntry(stroke());
    state().addText();
    state().loadBackground({
      image: null,
      previewUrl: "data:preview",
      mimeType: "image/jpeg",
      size: { width: 800, height: 600 },
    });
    expect(state().canvasSize).toEqual({ width: 800, height: 600 });
    expect(state().background.mimeType).toBe("image/jpeg");
    expect(state().log).toEqual([]);
    expect(state().selectedElementId).toBeNull();
  });

  it("setBackgroundImage conserva el dibujo", () => {
    state().addLogEntry(stroke());
    state().setBackgroundImage({
      image: null,
      previewUrl: "data:gradient",
      mimeType: "image/png",
    });
    expect(state().background.previewUrl).toBe("data:gradient");
    expect(state().log).toHaveLength(1);
  });
});

describe("historial", () => {
  it("addLogEntry agrega trazos en orden", () => {
    state().addLogEntry(stroke(1));
    state().addLogEntry(stroke(2));
    expect(state().log.map((entry) => (entry as PaintingEntry).size)).toEqual([
      1, 2,
    ]);
  });

  it("undo quita el último registro y no falla con el historial vacío", () => {
    state().undo();
    state().addLogEntry(stroke(1));
    state().addLogEntry(stroke(2));
    state().undo();
    expect(state().log).toHaveLength(1);
  });

  it("undo de un elemento seleccionado limpia la selección", () => {
    state().addLogEntry(stroke());
    state().addText();
    state().undo();
    expect(state().selectedElementId).toBeNull();
    expect(state().log).toHaveLength(1);
  });

  it("clearLog borra todo y la selección", () => {
    state().addText();
    state().addLogEntry(stroke());
    state().clearLog();
    expect(state().log).toEqual([]);
    expect(state().selectedElementId).toBeNull();
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
  it("tamaño y color se guardan por tipo de pincel", () => {
    state().setBrushType("spray");
    state().setBrushSize(120);
    state().setBrushColor({ r: 1, g: 2, b: 3, a: 1 });

    expect(selectCurrentBrush(state())).toEqual({
      size: 120,
      color: { r: 1, g: 2, b: 3, a: 1 },
    });

    state().setBrushType("normal");
    expect(selectCurrentBrush(state()).size).toBe(50);
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
  it("selectElements ignora trazos y devuelve la misma referencia si el log no cambia", () => {
    state().addLogEntry(stroke());
    state().addText();
    const first = selectElements(state());
    expect(first).toHaveLength(1);
    expect(selectElements(state())).toBe(first);
  });

  it("selectSelectedText devuelve null si lo seleccionado es una imagen", () => {
    state().addImage("blob:imagen");
    expect(selectSelectedElement(state())).not.toBeNull();
    expect(selectSelectedText(state())).toBeNull();
  });
});
