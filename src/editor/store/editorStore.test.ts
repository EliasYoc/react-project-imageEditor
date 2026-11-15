import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TEXT_STYLE, createStroke } from "../model/factories";
import type { Backdrop, StrokeEntry, TextElement } from "../model/types";
import { MAX_HISTORY, createEditorStore } from "./editorStore";
import {
  selectBrushColor,
  selectCanRedo,
  selectCanUndo,
  selectCurrentBrush,
  selectHasDocumentContent,
  selectElements,
  selectSelectedElement,
  selectSelectedText,
  selectStrokeLayers,
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

const emptyPhoto = {
  source: null,
  preview: null,
  mimeType: null,
  fileName: null,
};

const red: Backdrop = {
  fill: { kind: "color", color: { r: 255, g: 0, b: 0, a: 1 } },
  opacity: 1,
  blend: "source-over",
};

const addText = (x = 0) => state().addText({ x, y: 0 }, 50);
const addImage = () =>
  state().addImage({
    src: "blob:imagen",
    width: 100,
    height: 50,
    center: { x: 500, y: 400 },
  });

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

describe("foto y capa de color", () => {
  it("loadPhoto cambia el tamaño del lienzo y empieza de cero, sin historial ni capa", () => {
    state().addStroke(stroke());
    addText();
    state().setBackdrop(red);
    state().undo();
    state().loadPhoto({
      ...emptyPhoto,
      mimeType: "image/jpeg",
      size: { width: 800, height: 600 },
    });
    expect(state().canvasSize).toEqual({ width: 800, height: 600 });
    expect(state().photo.mimeType).toBe("image/jpeg");
    expect(state().log).toEqual([]);
    expect(state().backdrop.fill).toBeNull();
    expect(state().selectedElementId).toBeNull();
    expect(selectCanUndo(state())).toBe(false);
    expect(selectCanRedo(state())).toBe(false);
  });

  it("newDocument empieza un lienzo en blanco del tamaño pedido, sin foto ni historial", () => {
    state().loadPhoto({
      source: document.createElement("canvas"),
      preview: null,
      mimeType: "image/jpeg",
      fileName: "playa",
      size: { width: 800, height: 600 },
    });
    state().addStroke(stroke());
    state().setBackdrop(red);
    state().newDocument({ width: 1920, height: 1080 });

    expect(state().canvasSize).toEqual({ width: 1920, height: 1080 });
    expect(state().photo).toEqual(emptyPhoto);
    expect(state().log).toEqual([]);
    expect(state().backdrop.fill).toBeNull();
    expect(state().mode).toBe("draw");
    expect(selectCanUndo(state())).toBe(false);
  });

  it("hay contenido que perder con dibujo, foto o capa de color", () => {
    expect(selectHasDocumentContent(state())).toBe(false);
    state().setBackdrop(red);
    expect(selectHasDocumentContent(state())).toBe(true);
    state().newDocument({ width: 100, height: 100 });
    expect(selectHasDocumentContent(state())).toBe(false);
    state().addStroke(stroke());
    expect(selectHasDocumentContent(state())).toBe(true);
    state().loadPhoto({
      source: document.createElement("canvas"),
      preview: null,
      mimeType: "image/png",
      fileName: null,
      size: { width: 10, height: 10 },
    });
    expect(selectHasDocumentContent(state())).toBe(true);
  });

  it("setBackdrop conserva el dibujo y se puede deshacer y rehacer", () => {
    state().addStroke(stroke());
    state().setBackdrop(red);
    expect(state().backdrop).toEqual(red);
    expect(state().log).toHaveLength(1);

    state().undo();
    expect(state().backdrop.fill).toBeNull();
    expect(state().log).toHaveLength(1);
    state().redo();
    expect(state().backdrop).toEqual(red);
  });

  it("deshacer un trazo no cambia la capa de color que se puso antes", () => {
    state().setBackdrop(red);
    state().addStroke(stroke());
    state().undo();
    expect(state().backdrop).toEqual(red);
    expect(state().log).toHaveLength(0);
  });

  it("cambios seguidos con la misma clave (p. ej. arrastrar una parada) son un solo paso", () => {
    const pastBefore = state().past.length;
    for (const opacity of [0.9, 0.7, 0.5]) {
      state().setBackdrop({ ...red, opacity }, "opacity");
    }
    expect(state().past).toHaveLength(pastBefore + 1);
    expect(state().backdrop.opacity).toBe(0.5);
    state().undo();
    expect(state().backdrop.fill).toBeNull();
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
    addText();
    state().undo();
    expect(state().selectedElementId).toBeNull();
    expect(state().log).toHaveLength(1);
  });

  it("clearLog borra todo y se puede deshacer", () => {
    addText();
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

  it("deshacer restaura la versión exacta: también se deshace mover un texto", () => {
    const id = addText();
    state().editElement(id, { text: "Hola" });
    state().editElement(id, { x: 300, y: 200 });

    state().undo(); // vuelve a su sitio, con el texto escrito
    expect(selectSelectedText(state())).toMatchObject({
      x: 0,
      y: 0,
      text: "Hola",
    });

    state().undo(); // vuelve a estar vacío
    expect(selectSelectedText(state())).toMatchObject({ text: "" });

    state().redo();
    state().redo();
    expect(selectSelectedText(state())).toMatchObject({ x: 300, text: "Hola" });
  });

  it(`guarda como máximo ${MAX_HISTORY} pasos`, () => {
    for (let i = 0; i < MAX_HISTORY + 5; i++) state().addStroke(stroke(i));
    expect(state().past).toHaveLength(MAX_HISTORY);
  });
});

describe("elementos", () => {
  it("addText crea un texto vacío con el estilo por defecto, donde se pide, y lo selecciona", () => {
    const id = state().addText({ x: 120, y: 80 }, 64);
    expect(selectSelectedText(state())).toMatchObject({
      id,
      whatTask: "text",
      text: "",
      x: 120,
      y: 80,
      fontSize: 64,
      rotation: 0,
      scale: 1,
      width: null,
      ...DEFAULT_TEXT_STYLE,
    });
    expect(state().selectedElementId).toBe(id);
  });

  it("addImage centra la imagen en el punto pedido y queda por encima", () => {
    addText();
    addImage();
    const [first, second] = selectElements(state());
    expect(second.zIndex).toBeGreaterThan(first.zIndex);
    expect(second).toMatchObject({
      whatTask: "image",
      src: "blob:imagen",
      x: 450,
      y: 375,
      width: 100,
      height: 50,
    });
  });

  it("editElement cambia solo ese elemento, sin mutar el anterior, y crea un paso", () => {
    const a = addText();
    const b = addText();
    const before = state().log;
    const pastLength = state().past.length;
    state().editElement(a, { fontWeight: 900, text: "Hola" });

    expect(state().past).toHaveLength(pastLength + 1);
    expect(before[0]).toMatchObject({ fontWeight: 500, text: "" });
    const [textA, textB] = selectElements(state()) as TextElement[];
    expect(textA).toMatchObject({ id: a, fontWeight: 900, text: "Hola" });
    expect(textB).toBe(before[1]);
    expect(textB.id).toBe(b);
  });

  it("cambios seguidos con la misma clave se juntan en un solo paso", () => {
    const id = addText();
    const pastLength = state().past.length;
    for (const fontSize of [60, 70, 80]) {
      state().editElement(id, { fontSize }, `fontSize:${id}`);
    }
    expect(state().past).toHaveLength(pastLength + 1);

    // Otro cambio distinto cierra el grupo: el siguiente tamaño es otro paso.
    state().editElement(id, { fontWeight: 900 });
    state().editElement(id, { fontSize: 90 }, `fontSize:${id}`);
    expect(state().past).toHaveLength(pastLength + 3);

    state().undo();
    state().undo();
    state().undo();
    expect(selectSelectedText(state())?.fontSize).toBe(50);
  });

  it("removeElement lo quita, limpia la selección y se puede deshacer", () => {
    const id = addText();
    state().removeElement(id);
    expect(selectElements(state())).toHaveLength(0);
    expect(state().selectedElementId).toBeNull();
    state().undo();
    expect(selectElements(state())[0].id).toBe(id);
  });

  it("discardNewText quita un texto recién creado sin dejar rastro en el historial", () => {
    state().addStroke(stroke());
    const pastLength = state().past.length;
    const id = addText();
    state().startTextEditing(id);
    state().stopTextEditing();
    state().discardNewText(id);

    expect(selectElements(state())).toHaveLength(0);
    expect(state().past).toHaveLength(pastLength);
    expect(selectCanRedo(state())).toBe(false);
  });

  it("startTextEditing selecciona el texto y deshacerlo termina la edición", () => {
    const id = addText();
    state().startTextEditing(id);
    expect(state()).toMatchObject({ editingTextId: id, selectedElementId: id });
    state().undo();
    expect(state()).toMatchObject({
      editingTextId: null,
      selectedElementId: null,
    });
  });

  it("selectElement trae el elemento al frente y null deselecciona", () => {
    const a = addText();
    addText();
    state().selectElement(a);

    const [textA, textB] = selectElements(state());
    expect(state().selectedElementId).toBe(a);
    expect(textA.zIndex).toBeGreaterThan(textB.zIndex);

    state().selectElement(null);
    expect(selectSelectedElement(state())).toBeNull();
  });

  it("seleccionar el elemento que ya está al frente no cambia su zIndex", () => {
    addText();
    const b = addText();
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

describe("selectores", () => {
  it("selectElements y selectStrokes separan el log y devuelven la misma referencia si no cambia", () => {
    state().addStroke(stroke());
    addText();
    const elements = selectElements(state());
    const strokes = selectStrokes(state());
    expect(elements).toHaveLength(1);
    expect(strokes).toHaveLength(1);
    expect(selectElements(state())).toBe(elements);
    expect(selectStrokes(state())).toBe(strokes);
  });

  it("selectStrokeLayers separa el resaltador de la pintura y se memoriza", () => {
    const highlighter = {
      ...createStroke({
        brush: "highlighter",
        settings: { size: 30, opacity: 0.5, stabilizer: 0 },
        color: { r: 255, g: 230, b: 0, a: 1 },
      }),
      points: [{ x: 0, y: 0, pressure: 0.5 }],
    };
    state().addStroke(stroke());
    state().addStroke(highlighter);
    const layers = selectStrokeLayers(state());
    expect(layers.paint.map((entry) => entry.brush)).toEqual(["marker"]);
    expect(layers.highlight.map((entry) => entry.brush)).toEqual([
      "highlighter",
    ]);
    expect(selectStrokeLayers(state())).toBe(layers);
  });

  it("selectSelectedText devuelve null si lo seleccionado es una imagen", () => {
    addImage();
    expect(selectSelectedElement(state())).not.toBeNull();
    expect(selectSelectedText(state())).toBeNull();
  });
});
