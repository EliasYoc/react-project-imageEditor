import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Palette } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, IconButton } from ".";
import { mockMediaQueries } from "../../../test/media";
import { TooltipProvider } from "../Tooltip";

afterEach(() => mockMediaQueries(() => false));

describe("Button", () => {
  it("es un <button type='button'> accesible por su texto", () => {
    render(<Button>Dibujar</Button>);
    const button = screen.getByRole("button", { name: "Dibujar" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("se activa con el teclado (Tab + Enter)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Texto</Button>);

    await user.tab();
    expect(screen.getByRole("button", { name: "Texto" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("anuncia el estado de alternancia con aria-pressed", () => {
    render(<Button aria-pressed={true}>Dibujar</Button>);
    expect(screen.getByRole("button", { name: "Dibujar" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});

describe("IconButton", () => {
  it("usa aria-label como nombre accesible (sin tooltip en pantallas táctiles)", () => {
    render(<IconButton icon={Palette} aria-label="Abrir el editor" />);
    const button = screen.getByRole("button", { name: "Abrir el editor" });
    expect(button).not.toHaveAttribute("title");
  });

  it("con ratón, el tooltip muestra el nombre y el atajo", async () => {
    mockMediaQueries((query) => query.includes("hover"));
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <IconButton icon={Palette} aria-label="Deshacer" shortcut="Ctrl+Z" />
      </TooltipProvider>
    );
    await user.tab();
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Deshacer");
    expect(tooltip).toHaveTextContent("Ctrl+Z");
  });

  it("acepta ref (para usarlo como disparador de Radix)", () => {
    let node: HTMLButtonElement | null = null;
    render(
      <IconButton
        icon={Palette}
        aria-label="Más"
        ref={(element) => {
          node = element;
        }}
      />
    );
    expect(node).toBe(screen.getByRole("button", { name: "Más" }));
  });

  it("oculta el icono a los lectores de pantalla", () => {
    render(<IconButton icon={Palette} aria-label="Abrir el editor" />);
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("no responde si está deshabilitado", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton
        icon={Palette}
        aria-label="Deshacer"
        disabled
        onClick={onClick}
      />
    );
    await user.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
