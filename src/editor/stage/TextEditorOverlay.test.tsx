import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createInitialState, editorStore } from "../store/editorStore";
import TextEditorOverlay from "./TextEditorOverlay";

beforeEach(() => {
  editorStore.setState({ ...createInitialState(), mode: "text" });
});

describe("TextEditorOverlay", () => {
  it("al editar un texto que ya existe, el cursor queda al final y no se selecciona nada", () => {
    const { addText, editElement, startTextEditing } = editorStore.getState();
    const id = addText({ x: 0, y: 0 }, 100);
    editElement(id, { text: "Hola mundo" });
    startTextEditing(id);

    render(<TextEditorOverlay />);
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Texto",
    });
    expect(textarea).toHaveFocus();
    expect(textarea.selectionStart).toBe("Hola mundo".length);
    expect(textarea.selectionEnd).toBe("Hola mundo".length);
  });
});
