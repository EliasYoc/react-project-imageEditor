import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createStroke } from "../../editor/model/factories";
import { viewStore } from "../../editor/stage/viewStore";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import { getShortcutAction } from "./getShortcutAction";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

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

  it("no hace nada en la pantalla de inicio ni con Alt", () => {
    expect(getShortcutAction(key("z", { ctrlKey: true }), "home")).toBeNull();
    expect(
      getShortcutAction(key("z", { ctrlKey: true, altKey: true }), "draw")
    ).toBeNull();
  });
});

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    editorStore.setState({ ...createInitialState(), mode: "draw" });
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const press = (target: EventTarget, init: KeyboardEventInit) => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      ...init,
    });
    target.dispatchEvent(event);
    return event;
  };

  it("ejecuta la acción y evita la del navegador", () => {
    renderHook(() => useKeyboardShortcuts());
    editorStore.getState().addStroke(
      createStroke({
        brush: "marker",
        settings: { size: 1, opacity: 1, stabilizer: 0 },
        color: { r: 0, g: 0, b: 0, a: 1 },
      })
    );

    const event = press(window, { key: "z", ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(editorStore.getState().log).toHaveLength(0);

    press(window, { key: "e" });
    expect(editorStore.getState().brush.presetId).toBe("eraserHard");

    press(window, { key: "b" });
    press(window, { key: "]" });
    expect(editorStore.getState().brush.settings.pen.size).toBe(20); // 16 × 1.25
  });

  it("con pinceles pequeños [ y ] cambian al menos 1 px y no bajan de 1", () => {
    renderHook(() => useKeyboardShortcuts());
    editorStore.getState().setBrushSize(2);
    press(window, { key: "]" });
    expect(editorStore.getState().brush.settings.pen.size).toBe(3);
    for (let i = 0; i < 5; i++) press(window, { key: "[" });
    expect(editorStore.getState().brush.settings.pen.size).toBe(1);
  });

  it("acerca la vista con Ctrl + =", () => {
    renderHook(() => useKeyboardShortcuts());
    viewStore.getState().setStageSize({ width: 500, height: 500 });
    const before = viewStore.getState().view.scale;
    press(window, { key: "=", ctrlKey: true });
    expect(viewStore.getState().view.scale).toBeGreaterThan(before);
  });

  it("no actúa mientras se escribe en un campo", () => {
    renderHook(() => useKeyboardShortcuts());
    const input = document.createElement("input");
    document.body.append(input);

    const event = press(input, { key: "e" });
    expect(event.defaultPrevented).toBe(false);
    expect(editorStore.getState().brush.presetId).toBe("pen");
  });
});
