import { render, screen } from "@testing-library/react";
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
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-valuetext", "50 %");
    expect(screen.getByText("50 %")).toBeInTheDocument();
  });

  it("avisa del valor nuevo como número", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Slider label="Tamaño" value={10} min={1} max={200} onChange={onChange} />
    );
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(11);
    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(200);
  });

  // El arrastre con el ratón o el dedo necesita medidas reales: lo cubren los
  // tests e2e. Aquí solo se comprueba que se llega con el teclado.
  it("se alcanza con Tab", async () => {
    const user = userEvent.setup();
    render(
      <Slider label="Tamaño" value={10} min={1} max={200} onChange={() => {}} />
    );
    await user.tab();
    expect(screen.getByRole("slider", { name: "Tamaño" })).toHaveFocus();
  });
});
