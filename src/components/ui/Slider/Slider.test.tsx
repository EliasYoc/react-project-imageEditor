import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Slider } from ".";

describe("Slider", () => {
  it("es un slider con nombre accesible y muestra el valor", () => {
    render(
      <Slider
        label="Opacidad"
        value={50}
        min={0}
        max={100}
        valueText="50 %"
        onChange={() => {}}
      />
    );
    const slider = screen.getByRole("slider", { name: "Opacidad" });
    expect(slider).toHaveValue("50");
    expect(slider).toHaveAttribute("aria-valuetext", "50 %");
    expect(screen.getByText("50 %")).toBeInTheDocument();
  });

  it("avisa del valor nuevo como número", () => {
    const onChange = vi.fn();
    render(
      <Slider label="Tamaño" value={10} min={1} max={200} onChange={onChange} />
    );
    fireEvent.change(screen.getByRole("slider"), { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith(42);
  });

  // Las flechas, Inicio/Fin, etc. son del input nativo (jsdom no las
  // implementa): aquí solo se comprueba que se llega con el teclado.
  it("se alcanza con Tab", async () => {
    const user = userEvent.setup();
    render(
      <Slider label="Tamaño" value={10} min={1} max={200} onChange={() => {}} />
    );
    await user.tab();
    expect(screen.getByRole("slider", { name: "Tamaño" })).toHaveFocus();
  });
});
