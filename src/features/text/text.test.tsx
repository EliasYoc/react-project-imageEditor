import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TextElement } from "../../editor/model/types";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import { selectSelectedText } from "../../editor/store/selectors";
import { getShortcutAction } from "../shortcuts/getShortcutAction";
import FontPicker from "./FontPicker";
import TextStylePanel from "./TextStylePanel";
import { DEFAULT_TEXT_GRADIENT } from "./textGradientPresets";

// Las fuentes no se descargan en los tests.
vi.mock("../../editor/elements/fontLoader", () => ({
  ensureFont: vi.fn().mockResolvedValue(true),
  isFontReady: () => true,
}));

const text = () => selectSelectedText(editorStore.getState()) as TextElement;

beforeEach(() => {
  editorStore.setState({ ...createInitialState(), mode: "text" });
  editorStore.getState().addText({ x: 0, y: 0 }, 100);
});

describe("FontPicker", () => {
  it("muestra cada fuente en su tipo, marca la actual y la cambia", async () => {
    const { rerender } = render(<FontPicker text={text()} />);
    expect(screen.getByRole("button", { name: "Sistema" })).toBeInTheDocument();
    const pacifico = screen.getByRole("button", { name: "Pacifico" });
    expect(pacifico.style.fontFamily).toContain("Pacifico");

    await userEvent.click(pacifico);
    expect(text().fontId).toBe("pacifico");
    rerender(<FontPicker text={text()} />);
    expect(screen.getByRole("button", { name: "Pacifico" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("cambia el grosor entre normal y negrita", async () => {
    render(<FontPicker text={text()} />);
    const weights = screen.getByRole("group", { name: "Grosor" });
    await userEvent.click(
      Array.from(weights.querySelectorAll("button")).find(
        (button) => button.textContent === "Negrita"
      )!
    );
    expect(text().fontWeight).toBe(900);
  });
});

describe("TextStylePanel", () => {
  it("alinea el texto", async () => {
    render(<TextStylePanel text={text()} />);
    await userEvent.click(screen.getByRole("button", { name: "Centrar" }));
    expect(text().align).toBe("center");
  });

  it("activar el contorno muestra sus ajustes; el grosor es un solo paso del historial", async () => {
    const { rerender } = render(<TextStylePanel text={text()} />);
    expect(screen.queryByRole("slider", { name: "Grosor" })).toBeNull();

    await userEvent.click(screen.getByRole("checkbox", { name: "Contorno" }));
    expect(text().stroke.enabled).toBe(true);
    rerender(<TextStylePanel text={text()} />);

    const pastBefore = editorStore.getState().past.length;
    const slider = screen.getByRole("slider", { name: "Grosor" });
    for (const value of ["10", "15", "20"]) {
      fireEvent.change(slider, { target: { value } });
      rerender(<TextStylePanel text={text()} />);
    }
    expect(text().stroke.width).toBe(0.2);
    expect(editorStore.getState().past.length).toBe(pastBefore + 1);
  });

  it("caja de fondo: activarla y cambiar el margen", async () => {
    const { rerender } = render(<TextStylePanel text={text()} />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Caja de fondo" })
    );
    rerender(<TextStylePanel text={text()} />);
    fireEvent.change(screen.getByRole("slider", { name: "Margen" }), {
      target: { value: "40" },
    });
    expect(text().background).toMatchObject({ enabled: true, padding: 0.4 });
  });

  it("degradado: activarlo, cambiar la forma y recuperarlo al reactivarlo", async () => {
    const { rerender } = render(<TextStylePanel text={text()} />);
    const toggle = screen.getByRole("checkbox", { name: "Degradado" });
    expect(text().gradient).toBeNull();

    await userEvent.click(toggle);
    expect(text().gradient).toEqual(DEFAULT_TEXT_GRADIENT);
    rerender(<TextStylePanel text={text()} />);

    // Solo lineal y radial: el texto no admite cónico.
    const shapes = screen.getByRole("group", { name: "Forma del degradado" });
    expect(shapes.querySelectorAll("button")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Radial" }));
    expect(text().gradient?.type).toBe("radial");
    rerender(<TextStylePanel text={text()} />);
    // Radial: no hay ángulo.
    expect(screen.queryByRole("slider", { name: "Ángulo" })).toBeNull();

    await userEvent.click(toggle);
    expect(text().gradient).toBeNull();
    rerender(<TextStylePanel text={text()} />);
    await userEvent.click(toggle);
    expect(text().gradient?.type).toBe("radial");
  });

  it("degradado: girar el dial con el teclado es un solo paso del historial", async () => {
    editorStore.getState().editElement(text().id, {
      gradient: { ...DEFAULT_TEXT_GRADIENT, type: "linear", angle: 90 },
    });
    const { rerender } = render(<TextStylePanel text={text()} />);
    const pastBefore = editorStore.getState().past.length;

    screen.getByRole("slider", { name: "Ángulo" }).focus();
    for (let step = 0; step < 3; step++) {
      await userEvent.keyboard("{ArrowRight}");
      // En la app, el panel se vuelve a renderizar con el texto del store.
      rerender(<TextStylePanel text={text()} />);
    }
    expect(text().gradient?.angle).toBe(93);
    expect(editorStore.getState().past.length).toBe(pastBefore + 1);
  });

  it("degradado: un preset reemplaza las paradas", async () => {
    editorStore.getState().editElement(text().id, {
      gradient: DEFAULT_TEXT_GRADIENT,
    });
    render(<TextStylePanel text={text()} />);
    const presets = screen.getByRole("group", { name: "Degradados" });
    // Sin cónicos ni la viñeta.
    expect(
      Array.from(presets.querySelectorAll("button")).map(
        (button) => button.title
      )
    ).not.toContain("Arcoíris");
    await userEvent.click(screen.getByRole("button", { name: "Océano" }));
    expect(text().gradient?.stops[0].color).toEqual({
      r: 33,
      g: 147,
      b: 176,
      a: 1,
    });
  });
});

describe("atajo de negrita", () => {
  it("Ctrl/⌘ + B solo en modo Texto", () => {
    const key = {
      key: "b",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    };
    expect(getShortcutAction(key, "text")).toEqual({ type: "toggleBold" });
    expect(getShortcutAction(key, "draw")).toBeNull();
  });
});
