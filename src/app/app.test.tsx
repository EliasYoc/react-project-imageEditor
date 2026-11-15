import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// El editor de verdad necesita Konva y un canvas real: aquí basta con saber
// cuándo se monta y si está abierto.
vi.mock("./EditorShell", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="editor">{isOpen ? "abierto" : "oculto"}</div>
  ),
}));

/**
 * App y el store recién cargados (vi.resetModules): cada test empieza sin el
 * editor en caché y usa la misma instancia del store que la App.
 */
const loadApp = async () => ({
  App: (await import("./App")).default,
  editorStore: (await import("../editor/store/editorStore")).editorStore,
});

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
});

afterEach(() => vi.useRealTimers());

describe("carga del editor bajo demanda", () => {
  it("el inicio se pinta sin el editor, que se precarga después en segundo plano", async () => {
    const { App } = await loadApp();
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Editor de imágenes" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("editor")).toBeNull();

    // jsdom no tiene requestIdleCallback: se usa el temporizador de respaldo.
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    // Precargado y montado, pero oculto mientras se está en el inicio.
    expect(screen.getByTestId("editor")).toHaveTextContent("oculto");
  });

  it("al abrir el editor antes de que llegue, se ve 'Cargando el editor' y luego el editor", async () => {
    const { App, editorStore } = await loadApp();
    render(<App />);
    act(() => editorStore.getState().newDocument({ width: 100, height: 100 }));
    expect(
      screen.getByRole("status", { name: "Cargando el editor" })
    ).toBeInTheDocument();

    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId("editor")).toHaveTextContent("abierto");
    expect(
      screen.queryByRole("status", { name: "Cargando el editor" })
    ).toBeNull();
  });
});
