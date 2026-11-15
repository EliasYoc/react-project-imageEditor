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
