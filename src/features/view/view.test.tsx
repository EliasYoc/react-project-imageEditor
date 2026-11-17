import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { uiStore } from "../../app/uiStore";
import { TooltipProvider } from "../../components/ui/Tooltip";
import { NO_INSETS } from "../../editor/engine/viewport";
import { viewStore } from "../../editor/stage/viewStore";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import { mockMediaQueries } from "../../test/media";
import { EditorHeader } from "../editor-header";
import { SHORTCUT_LABELS } from "../shortcuts";
import ViewMenu from "./components/ViewMenu";

const view = () => viewStore.getState();

afterEach(() => mockMediaQueries(() => false));

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  screen.getByRole("button", { name: "Más opciones de la vista" }).focus();
  await user.keyboard("{Enter}");
};

beforeEach(() => {
  editorStore.setState({
    ...createInitialState(),
    mode: "draw",
    canvasSize: { width: 1000, height: 1000 },
  });
  uiStore.setState({ areBarsHidden: false });
  view().setInsets(NO_INSETS);
  view().setStageSize({ width: 500, height: 500 });
  view().fitToScreen();
});

describe("ViewMenu", () => {
  it("con teclado y ratón, cada opción muestra su atajo", async () => {
    mockMediaQueries((query) => query.includes("hover"));
    const user = userEvent.setup();
    // Con ratón, los botones muestran tooltips.
    render(
      <TooltipProvider>
        <ViewMenu />
      </TooltipProvider>
    );
    await openMenu(user);
    const zoomIn = screen.getByRole("menuitem", { name: "Acercar" });
    expect(zoomIn).toHaveTextContent(SHORTCUT_LABELS.zoomIn);
    expect(
      screen.getByRole("menuitem", { name: "Ajustar a la pantalla" })
    ).toHaveTextContent(SHORTCUT_LABELS.fit);
  });

  it("en pantallas táctiles no muestra atajos", async () => {
    const user = userEvent.setup();
    render(<ViewMenu />);
    await openMenu(user);
    expect(screen.getByRole("menuitem", { name: "Acercar" })).toHaveTextContent(
      /^Acercar$/
    );
  });

  it("muestra el zoom y acerca sin cerrarse", async () => {
    const user = userEvent.setup();
    render(<ViewMenu />);
    await openMenu(user);
    expect(screen.getByText("Zoom: 50 %")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Acercar" }));
    // Sigue abierto y el porcentaje cambia: se puede volver a pulsar.
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Zoom: 63 %")).toBeInTheDocument();
    expect(view().isFitted).toBe(false);

    await user.click(
      screen.getByRole("menuitem", { name: "Ajustar a la pantalla" })
    );
    expect(view().isFitted).toBe(true);
    expect(view().view.scale).toBe(0.5);
    // Ajustar sí cierra el menú.
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("no deja alejar más allá del límite", async () => {
    const user = userEvent.setup();
    render(<ViewMenu />);
    for (let i = 0; i < 10; i++) view().zoomBy(0.5);
    await openMenu(user);
    expect(screen.getByRole("menuitem", { name: "Alejar" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("oculta y vuelve a mostrar las barras", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TooltipProvider>
        <EditorHeader />
        <ViewMenu />
      </TooltipProvider>
    );
    const header = container.querySelector("header");
    expect(header).not.toHaveAttribute("inert");

    // Un botón al lado del menú (no una opción del menú).
    await user.click(
      screen.getByRole("button", { name: "Ocultar las barras" })
    );
    expect(uiStore.getState().areBarsHidden).toBe(true);
    // Oculta: fuera del orden de Tab y de los lectores de pantalla.
    expect(header).toHaveAttribute("inert");
    expect(header).toHaveAttribute("data-hidden");

    // Sigue a la vista con las barras ocultas, para volver a mostrarlas.
    await user.click(
      screen.getByRole("button", { name: "Mostrar las barras" })
    );
    expect(uiStore.getState().areBarsHidden).toBe(false);
    expect(header).not.toHaveAttribute("inert");
  });
});
