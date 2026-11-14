import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BiPalette } from "react-icons/bi";
import { describe, expect, it, vi } from "vitest";
import { Button, IconButton } from ".";

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
  it("usa aria-label como nombre accesible y como tooltip", () => {
    render(<IconButton icon={BiPalette} aria-label="Abrir el editor" />);
    const button = screen.getByRole("button", { name: "Abrir el editor" });
    expect(button).toHaveAttribute("title", "Abrir el editor");
  });

  it("oculta el icono a los lectores de pantalla", () => {
    render(<IconButton icon={BiPalette} aria-label="Abrir el editor" />);
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("no responde si está deshabilitado", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton
        icon={BiPalette}
        aria-label="Deshacer"
        disabled
        onClick={onClick}
      />
    );
    await user.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
