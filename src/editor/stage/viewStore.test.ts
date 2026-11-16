import { beforeEach, describe, expect, it } from "vitest";
import { MAX_ZOOM } from "../engine/viewport";
import { editorStore } from "../store/editorStore";
import { createViewStore } from "./viewStore";

let store: ReturnType<typeof createViewStore>;
const state = () => store.getState();

beforeEach(() => {
  editorStore.setState({ canvasSize: { width: 1000, height: 1000 } });
  store = createViewStore();
  state().setStageSize({ width: 500, height: 1000 });
});

describe("viewStore", () => {
  it("empieza ajustado y se vuelve a ajustar al cambiar el tamaño", () => {
    expect(state().view).toEqual({ x: 0, y: 250, scale: 0.5 });
    state().setStageSize({ width: 1000, height: 500 });
    expect(state().view).toEqual({ x: 250, y: 0, scale: 0.5 });
    expect(state().isFitted).toBe(true);
  });

  it("después de hacer zoom, cambiar el tamaño conserva la escala", () => {
    state().zoomBy(2);
    expect(state().isFitted).toBe(false);
    expect(state().view.scale).toBe(1);
    state().setStageSize({ width: 400, height: 800 });
    expect(state().view.scale).toBe(1);
  });

  it("zoomBy acerca respecto al centro del área", () => {
    state().zoomBy(2);
    // El centro del área (250, 500) sigue mostrando el centro del documento.
    const { x, y, scale } = state().view;
    expect((250 - x) / scale).toBeCloseTo(500);
    expect((500 - y) / scale).toBeCloseTo(500);
  });

  it("no pasa de los límites de zoom", () => {
    for (let i = 0; i < 40; i++) state().zoomBy(2);
    expect(state().view.scale).toBe(MAX_ZOOM);
  });

  it("fitToScreen vuelve a la vista ajustada", () => {
    state().zoomBy(3);
    state().panBy(100, 100);
    state().fitToScreen();
    expect(state().view).toEqual({ x: 0, y: 250, scale: 0.5 });
    expect(state().isFitted).toBe(true);
  });

  it("al tapar la cabecera parte del área, se vuelve a ajustar en el resto", () => {
    state().setStageSize({ width: 1000, height: 600 });
    state().setInsets({ top: 100, right: 0, bottom: 0, left: 0 });
    expect(state().view).toEqual({ x: 250, y: 100, scale: 0.5 });

    // Los botones acercan respecto al centro de lo que se ve (500, 350):
    // sigue mostrando el centro del documento.
    state().zoomBy(2);
    const { x, y, scale } = state().view;
    expect((500 - x) / scale).toBeCloseTo(500);
    expect((350 - y) / scale).toBeCloseTo(500);
  });

  it("panBy no deja perder el documento", () => {
    state().panBy(100000, 0);
    const { x, scale } = state().view;
    // El centro del documento queda, como mucho, en el borde derecho.
    expect(x + (1000 * scale) / 2).toBeCloseTo(500);
  });
});
