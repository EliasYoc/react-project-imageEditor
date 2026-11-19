import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { uiStore } from "../../app/uiStore";
import { createStroke } from "../../editor/model/factories";
import { viewStore } from "../../editor/stage/viewStore";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import { createFakeVideoSource, mockObjectUrls } from "../../test/video";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    mockObjectUrls();
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

  it("O oculta y vuelve a mostrar las barras", () => {
    renderHook(() => useKeyboardShortcuts());
    uiStore.setState({ areBarsHidden: false });
    press(window, { key: "o" });
    expect(uiStore.getState().areBarsHidden).toBe(true);
    press(window, { key: "O" });
    expect(uiStore.getState().areBarsHidden).toBe(false);
  });

  it("K reproduce y pausa el video abierto", () => {
    renderHook(() => useKeyboardShortcuts());
    const video = createFakeVideoSource();
    editorStore.setState({
      photo: {
        source: null,
        preview: null,
        mimeType: null,
        fileName: "clip",
        video,
      },
    });

    const event = press(window, { key: "k" });
    expect(event.defaultPrevented).toBe(true);
    expect(video.element.paused).toBe(false);
    press(window, { key: "K" });
    expect(video.element.paused).toBe(true);
  });

  it("sin un video abierto, K no hace nada", () => {
    renderHook(() => useKeyboardShortcuts());
    expect(() => press(window, { key: "k" })).not.toThrow();
    expect(editorStore.getState().log).toHaveLength(0);
  });

  it("acerca la vista con Ctrl + =", () => {
    renderHook(() => useKeyboardShortcuts());
    viewStore.getState().setStageSize({ width: 500, height: 500 });
    const before = viewStore.getState().view.scale;
    press(window, { key: "=", ctrlKey: true });
    expect(viewStore.getState().view.scale).toBeGreaterThan(before);
  });

  it("no actúa mientras se abre o se exporta algo", () => {
    renderHook(() => useKeyboardShortcuts());
    for (const status of ["exportingVideo", "exporting", "loading"] as const) {
      editorStore.setState({ status });
      const event = press(window, { key: "e" });
      expect(event.defaultPrevented).toBe(false);
      expect(editorStore.getState().brush.presetId).toBe("pen");
    }
    editorStore.setState({ status: "idle" });
    press(window, { key: "e" });
    expect(editorStore.getState().brush.presetId).toBe("eraserHard");
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
