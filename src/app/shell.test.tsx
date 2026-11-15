import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, toastStore } from "../components/ui/Toast";
import { TooltipProvider } from "../components/ui/Tooltip";
import { createStroke } from "../editor/model/factories";
import { createInitialState, editorStore } from "../editor/store/editorStore";
import SizeSlider from "../features/drawing/SizeSlider";
import EditorHeader from "../features/editor-header/EditorHeader";
import { defaultExportName } from "../features/export/exportName";
import ShortcutsDialog from "../features/shortcuts/ShortcutsDialog";
import { useKeyboardShortcuts } from "../features/shortcuts/useKeyboardShortcuts";
import { mockMediaQueries } from "../test/media";
import { uiStore } from "./uiStore";

const exportImage = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ result: "downloaded", fileName: "dibujo.png" })
);
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
      <Toaster />
    </TooltipProvider>
  );

beforeEach(() => {
  editorStore.setState({ ...createInitialState(), mode: "draw" });
  toastStore.setState({ toasts: [] });
  exportImage.mockClear();
});

const exportWithEnter = async () => {
  const user = userEvent.setup();
  renderHeader();
  await user.click(screen.getByRole("button", { name: "Exportar" }));
  await user.keyboard("{Enter}");
};

describe("avisos", () => {
  it("al descargar avisa con el nombre del archivo", async () => {
    await exportWithEnter();
    expect(
      await screen.findByText("Imagen descargada: dibujo.png")
    ).toBeInTheDocument();
  });

  it("con la hoja de compartir del móvil no avisa (el sistema ya responde)", async () => {
    exportImage.mockResolvedValueOnce({
      result: "shared",
      fileName: "dibujo.png",
    });
    await exportWithEnter();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toastStore.getState().toasts).toHaveLength(0);
  });

  it("si falla la exportación, avisa del error", async () => {
    exportImage.mockRejectedValueOnce(new Error("sin memoria"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await exportWithEnter();
    expect(
      await screen.findByText("No se pudo exportar la imagen")
    ).toBeInTheDocument();
    expect(toastStore.getState().toasts[0].kind).toBe("error");
  });

  it("un aviso se quita de la cola al cerrarse", () => {
    toastStore.getState().show("success", "Hola");
    const [{ id }] = toastStore.getState().toasts;
    toastStore.getState().dismiss(id);
    expect(toastStore.getState().toasts).toHaveLength(0);
  });
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
    expect(input).toHaveValue(
      defaultExportName({ hasPhoto: false, fileName: null })
    );
    expect(dialog).toHaveTextContent(".png");

    await user.clear(input);
    await user.type(input, "mi-dibujo{Enter}");
    expect(exportImage).toHaveBeenCalledWith({ fileName: "mi-dibujo" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("el nombre sugerido usa la fecha local", () => {
    const night = new Date(2026, 0, 5, 23, 30);
    expect(defaultExportName({ hasPhoto: false, fileName: null }, night)).toBe(
      "dibujo-2026-01-05"
    );
    expect(defaultExportName({ hasPhoto: true, fileName: null }, night)).toBe(
      "foto-editada-2026-01-05"
    );
  });

  it("con una foto abierta desde un archivo, sugiere su nombre + -editada", async () => {
    const user = userEvent.setup();
    state().loadPhoto({
      source: document.createElement("canvas"),
      preview: null,
      mimeType: "image/jpeg",
      fileName: "playa",
      size: { width: 10, height: 10 },
    });
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    const dialog = screen.getByRole("dialog", { name: "Exportar imagen" });
    expect(within(dialog).getByLabelText("Nombre del archivo")).toHaveValue(
      "playa-editada"
    );
    expect(dialog).toHaveTextContent(".jpg");
  });
});

describe("atajos globales", () => {
  const Shell = () => {
    useKeyboardShortcuts();
    return (
      <TooltipProvider>
        <EditorHeader />
        <ShortcutsDialog />
      </TooltipProvider>
    );
  };

  beforeEach(() => uiStore.setState({ dialog: null }));

  it("Ctrl/⌘ + S abre el diálogo de exportar", () => {
    render(<Shell />);
    fireEvent.keyDown(document.body, { key: "s", ctrlKey: true });
    expect(
      screen.getByRole("dialog", { name: "Exportar imagen" })
    ).toBeInTheDocument();
  });

  it("? abre la lista de atajos (y Escape la cierra)", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    fireEvent.keyDown(document.body, { key: "?", shiftKey: true });
    const dialog = screen.getByRole("dialog", { name: "Atajos de teclado" });
    expect(within(dialog).getByText("Exportar")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("la opción del menú solo aparece con teclado y ratón", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Shell />);
    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{Enter}");
    expect(
      screen.queryByRole("menuitem", { name: "Atajos de teclado" })
    ).toBeNull();
    await user.keyboard("{Escape}");
    unmount();

    mockMediaQueries((query) => query.includes("hover"));
    render(<Shell />);
    screen.getByRole("button", { name: "Más opciones" }).focus();
    await user.keyboard("{Enter}");
    await user.click(
      screen.getByRole("menuitem", { name: "Atajos de teclado" })
    );
    expect(
      screen.getByRole("dialog", { name: "Atajos de teclado" })
    ).toBeInTheDocument();
    mockMediaQueries(() => false);
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
