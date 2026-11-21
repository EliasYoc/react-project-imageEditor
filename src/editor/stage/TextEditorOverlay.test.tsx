import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NO_INSETS } from "../engine/viewport";
import type { TextElement } from "../model/types";
import { createInitialState, editorStore } from "../store/editorStore";
import { selectElements } from "../store/selectors";
import TextEditorOverlay from "./TextEditorOverlay";
import { viewStore } from "./viewStore";

const element = (id: string) =>
  selectElements(editorStore.getState()).find(
    (candidate) => candidate.id === id
  ) as TextElement;

const textarea = () =>
  screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Texto" });

beforeEach(() => {
  editorStore.setState({ ...createInitialState(), mode: "text" });
  // Un lienzo de 400 × 800 con el documento a media escala y sin desplazar.
  viewStore.setState({
    stageSize: { width: 400, height: 800 },
    insets: NO_INSETS,
    view: { x: 0, y: 0, scale: 0.5 },
  });
});

describe("TextEditorOverlay: ancho máximo", () => {
  afterEach(() => vi.restoreAllMocks());

  /** jsdom no mide: se simula lo que ocuparía el texto escrito en una línea. */
  const typeTextOfWidth = (contentWidth: number) => {
    vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(
      contentWidth
    );
    const { addText, startTextEditing } = editorStore.getState();
    startTextEditing(addText({ x: 0, y: 0 }, 100));
    render(<TextEditorOverlay />);
  };

  // El lienzo por defecto mide 1440 de ancho: el máximo es 1296.
  it("un texto que cabe mide lo que ocupa, sin repartirse en líneas", () => {
    typeTextOfWidth(500);
    expect(textarea().style.width).toBe("500px");
    expect(textarea().style.whiteSpace).toBe("");
  });

  it("un texto más ancho que el 90 % del lienzo se limita a él y se reparte en líneas", () => {
    typeTextOfWidth(3000);
    expect(textarea().style.width).toBe("1296px");
    expect(textarea().style.whiteSpace).toBe("pre-wrap");
  });

  it("un texto con ancho fijado conserva el suyo, aunque pase del máximo", () => {
    const { addText, editElement, startTextEditing } = editorStore.getState();
    const id = addText({ x: 0, y: 0 }, 100);
    editElement(id, { text: "Hola", width: 2000 });
    startTextEditing(id);
    render(<TextEditorOverlay />);
    expect(textarea().style.width).toBe("2000px");
  });
});

describe("TextEditorOverlay", () => {
  it("al editar un texto que ya existe, el cursor queda al final y no se selecciona nada", () => {
    const { addText, editElement, startTextEditing } = editorStore.getState();
    const id = addText({ x: 0, y: 0 }, 100);
    editElement(id, { text: "Hola mundo" });
    startTextEditing(id);

    render(<TextEditorOverlay />);
    expect(textarea()).toHaveFocus();
    expect(textarea().selectionStart).toBe("Hola mundo".length);
    expect(textarea().selectionEnd).toBe("Hola mundo".length);
  });

  it("un texto nuevo queda donde se escribió: en el sitio del editor, no donde se creó", async () => {
    const { addText, startTextEditing } = editorStore.getState();
    const id = addText({ x: 500, y: 500 }, 100);
    startTextEditing(id);

    render(<TextEditorOverlay />);
    await userEvent.type(textarea(), "Hola");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");

    // El editor está centrado (x = 200 en pantalla) y a un 40 % del alto (y =
    // 320); en el documento, con la vista a media escala, es (400, 640). En
    // jsdom el editor no mide ancho, así que no se resta su mitad.
    expect(element(id)).toMatchObject({ text: "Hola", x: 400, y: 640 });
  });

  it("un texto que ya existía vuelve a su sitio, con su giro, al terminar de editarlo", async () => {
    const { addText, editElement, startTextEditing } = editorStore.getState();
    const id = addText({ x: 500, y: 500 }, 100);
    editElement(id, { text: "Hola", rotation: 30 });
    startTextEditing(id);

    render(<TextEditorOverlay />);
    await userEvent.type(textarea(), " mundo");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");

    expect(element(id)).toMatchObject({
      text: "Hola mundo",
      x: 500,
      y: 500,
      rotation: 30,
    });
  });
});
