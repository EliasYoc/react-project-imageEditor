import { describe, expect, it } from "vitest";
import { getShortcutAction } from "./getShortcutAction";

const key = (key: string, modifiers: Partial<KeyboardEventInit> = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...modifiers,
});

describe("getShortcutAction", () => {
  it("Ctrl/⌘ + Z deshace y con Shift rehace; Ctrl + Y también rehace", () => {
    expect(getShortcutAction(key("z", { ctrlKey: true }), "draw")).toEqual({
      type: "undo",
    });
    expect(
      getShortcutAction(key("Z", { metaKey: true, shiftKey: true }), "text")
    ).toEqual({ type: "redo" });
    expect(getShortcutAction(key("y", { ctrlKey: true }), "draw")).toEqual({
      type: "redo",
    });
  });

  it("zoom con Ctrl + 0, = y − en modo Dibujar y en modo Texto", () => {
    expect(getShortcutAction(key("0", { ctrlKey: true }), "draw")).toEqual({
      type: "fit",
    });
    expect(getShortcutAction(key("+", { ctrlKey: true }), "draw")).toEqual({
      type: "zoomIn",
    });
    expect(getShortcutAction(key("-", { ctrlKey: true }), "draw")).toEqual({
      type: "zoomOut",
    });
    expect(getShortcutAction(key("0", { ctrlKey: true }), "text")).toEqual({
      type: "fit",
    });
  });

  it("en modo Texto, Supr y Retroceso eliminan y Escape quita la selección", () => {
    expect(getShortcutAction(key("Delete"), "text")).toEqual({
      type: "deleteElement",
    });
    expect(getShortcutAction(key("Backspace"), "text")).toEqual({
      type: "deleteElement",
    });
    expect(getShortcutAction(key("Escape"), "text")).toEqual({
      type: "deselect",
    });
    expect(getShortcutAction(key("Delete"), "draw")).toBeNull();
  });

  it("B y E alternan pincel y borrador solo en modo Dibujar y sin modificadores", () => {
    expect(getShortcutAction(key("e"), "draw")).toEqual({ type: "eraser" });
    expect(getShortcutAction(key("B"), "draw")).toEqual({ type: "drawBrush" });
    expect(getShortcutAction(key("b"), "text")).toBeNull();
    expect(getShortcutAction(key("b", { shiftKey: true }), "draw")).toBeNull();
  });

  it("[ y ] cambian el tamaño, también por la tecla física (teclado español)", () => {
    expect(getShortcutAction(key("]"), "draw")).toEqual({
      type: "brushSize",
      factor: 1.25,
    });
    expect(
      getShortcutAction({ ...key("+"), code: "BracketRight" }, "draw")
    ).toMatchObject({ type: "brushSize", factor: 1.25 });
    expect(
      getShortcutAction({ ...key("´"), code: "BracketLeft" }, "draw")
    ).toMatchObject({ type: "brushSize", factor: 0.8 });
  });

  it("Ctrl/⌘ + S exporta y ? abre la lista de atajos, en los dos modos", () => {
    for (const mode of ["draw", "text"] as const) {
      expect(getShortcutAction(key("s", { ctrlKey: true }), mode)).toEqual({
        type: "export",
      });
      expect(getShortcutAction(key("?", { shiftKey: true }), mode)).toEqual({
        type: "showShortcuts",
      });
    }
    expect(getShortcutAction(key("s", { metaKey: true }), "home")).toBeNull();
  });

  it("O oculta o muestra las barras, en los dos modos", () => {
    for (const mode of ["draw", "text"] as const) {
      expect(getShortcutAction(key("o"), mode)).toEqual({
        type: "toggleBars",
      });
    }
    expect(getShortcutAction(key("o", { ctrlKey: true }), "draw")).toBeNull();
    expect(getShortcutAction(key("o"), "home")).toBeNull();
  });

  it("K reproduce o pausa el video, en los dos modos", () => {
    for (const mode of ["draw", "text"] as const) {
      expect(getShortcutAction(key("k"), mode)).toEqual({
        type: "togglePlayback",
      });
      expect(getShortcutAction(key("K"), mode)).toEqual({
        type: "togglePlayback",
      });
    }
    expect(getShortcutAction(key("k", { ctrlKey: true }), "draw")).toBeNull();
    expect(getShortcutAction(key("k", { shiftKey: true }), "draw")).toBeNull();
    expect(getShortcutAction(key("k"), "home")).toBeNull();
  });

  it("Ctrl/⌘ + B pone negrita solo en modo Texto", () => {
    const bold = key("b", { ctrlKey: true });
    expect(getShortcutAction(bold, "text")).toEqual({ type: "toggleBold" });
    expect(getShortcutAction(bold, "draw")).toBeNull();
  });

  it("no hace nada en la pantalla de inicio ni con Alt", () => {
    expect(getShortcutAction(key("z", { ctrlKey: true }), "home")).toBeNull();
    expect(
      getShortcutAction(key("z", { ctrlKey: true, altKey: true }), "draw")
    ).toBeNull();
  });
});
