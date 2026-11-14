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

  it("zoom con Ctrl + 0, = y − solo en modo Dibujar", () => {
    expect(getShortcutAction(key("0", { ctrlKey: true }), "draw")).toEqual({
      type: "fit",
    });
    expect(getShortcutAction(key("+", { ctrlKey: true }), "draw")).toEqual({
      type: "zoomIn",
    });
    expect(getShortcutAction(key("-", { ctrlKey: true }), "draw")).toEqual({
      type: "zoomOut",
    });
    expect(getShortcutAction(key("0", { ctrlKey: true }), "text")).toBeNull();
  });

  it("B, S y E eligen el pincel solo en modo Dibujar y sin modificadores", () => {
    expect(getShortcutAction(key("e"), "draw")).toEqual({
      type: "brush",
      brush: "eraser",
    });
    expect(getShortcutAction(key("S"), "draw")).toEqual({
      type: "brush",
      brush: "spray",
    });
    expect(getShortcutAction(key("b"), "text")).toBeNull();
    expect(getShortcutAction(key("b", { shiftKey: true }), "draw")).toBeNull();
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
    editorStore
      .getState()
      .addStroke(
        createStroke("normal", { size: 1, color: { r: 0, g: 0, b: 0, a: 1 } })
      );

    const event = press(window, { key: "z", ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(editorStore.getState().log).toHaveLength(0);

    press(window, { key: "e" });
    expect(editorStore.getState().brush.type).toBe("eraser");
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
    expect(editorStore.getState().brush.type).toBe("normal");
  });
});
