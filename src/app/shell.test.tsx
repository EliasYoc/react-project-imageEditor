import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../components/ui/Tooltip";
import { createStroke } from "../editor/model/factories";
import { createInitialState, editorStore } from "../editor/store/editorStore";
import SizeSlider from "../features/drawing/SizeSlider";
import EditorHeader from "../features/editor-header/EditorHeader";
import { defaultExportName } from "../features/export/exportName";
import { useKeyboardShortcuts } from "../features/shortcuts/useKeyboardShortcuts";

const exportImage = vi.hoisted(() => vi.fn().mockResolvedValue("downloaded"));
vi.mock("../features/export/exportImage", () => ({ exportImage }));

const state = () => editorStore.getState();

const addStroke = () =>
  state().addStroke({
    ...createStroke({
      brush: "pen",
      settings: { size: 10, opacity: 1, stabilizer: 0 },
      color: { r: 0, g: 0, b: 0, a: 1 },
    }),
    points: [{ x: 0, y: 0, pressure: 0.5 }],
  });

const renderHeader = () =>
  render(
    <TooltipProvider>
      <EditorHeader />
    </TooltipProvider>
  );

beforeEach(() => {
  editorStore.setState({ ...createInitialState(), mode: "draw" });
  exportImage.mockClear();
});

describe("cabecera", () => {
  it("Fondo está a la vista y abre su panel", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Fondo" }));
    expect(screen.getByRole("dialog", { name: "Fondo" })).toBeInTheDocument();
  });

  it("borrar el dibujo pide confirmación (y se puede deshacer)", async () => {
    const user = userEvent.setup();
    addStroke();
    renderHeader();
    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{Enter}");
    await user.click(
      screen.getByRole("menuitem", { name: "Borrar el dibujo" })
    );

    const confirm = screen.getByRole("alertdialog", {
      name: "¿Borrar el dibujo?",
    });
    await user.click(within(confirm).getByRole("button", { name: "Borrar" }));
    expect(state().log).toHaveLength(0);
    state().undo();
    expect(state().log).toHaveLength(1);
  });

  it("sin dibujo, la opción de borrar está deshabilitada", async () => {
    const user = userEvent.setup();
    renderHeader();
    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("menuitem", { name: "Borrar el dibujo" })
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("exportar propone un nombre y exporta con Enter", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Exportar" }));

    const dialog = screen.getByRole("dialog", { name: "Exportar imagen" });
    const input = within(dialog).getByLabelText("Nombre del archivo");
    expect(input).toHaveValue(defaultExportName(false));
    expect(dialog).toHaveTextContent(".png");

    await user.clear(input);
    await user.type(input, "mi-dibujo{Enter}");
    expect(exportImage).toHaveBeenCalledWith({ fileName: "mi-dibujo" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("el nombre sugerido usa la fecha local", () => {
    expect(defaultExportName(true, new Date(2026, 0, 5, 23, 30))).toBe(
      "foto-editada-2026-01-05"
    );
  });
});

describe("slider de tamaño", () => {
  it("es uno solo (el del pincel) y se mueve con el teclado", async () => {
    const user = userEvent.setup();
    render(<SizeSlider />);
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    const size = screen.getByRole("slider", { name: "Tamaño del pincel" });
    expect(size).toHaveAttribute(
      "aria-valuetext",
      `${state().brush.settings.pen.size} px`
    );
    const before = state().brush.settings.pen.size;
    size.focus();
    await user.keyboard("{PageUp}");
    expect(state().brush.settings.pen.size).toBeGreaterThan(before);
  });

  it("en modo Texto, el tamaño de letra del texto seleccionado", () => {
    editorStore.setState({ mode: "text" });
    const { rerender } = render(<SizeSlider />);
    expect(screen.queryByRole("slider")).toBeNull();
    state().addText({ x: 0, y: 0 }, 100);
    rerender(<SizeSlider />);
    expect(
      screen.getByRole("slider", { name: "Tamaño del texto" })
    ).toHaveAttribute("aria-valuetext", "100 px");
  });
});

describe("atajos con un panel abierto", () => {
  const Shortcuts = () => {
    useKeyboardShortcuts();
    return (
      <div role="dialog" aria-label="Estilo del texto">
        <button type="button">Dentro</button>
      </div>
    );
  };

  it("Supr dentro de un panel no borra el texto seleccionado", () => {
    editorStore.setState({ mode: "text" });
    state().addText({ x: 0, y: 0 }, 100);
    render(<Shortcuts />);
    const inside = screen.getByRole("button", { name: "Dentro" });
    fireEvent.keyDown(inside, { key: "Delete" });
    expect(state().log).toHaveLength(1);

    fireEvent.keyDown(document.body, { key: "Delete" });
    expect(state().log).toHaveLength(0);
  });

  it("una tecla que ya usó un componente no dispara el atajo", () => {
    render(<Shortcuts />);
    const event = new KeyboardEvent("keydown", { key: "e", cancelable: true });
    event.preventDefault();
    window.dispatchEvent(event);
    expect(state().brush.presetId).toBe("pen");
  });
});
