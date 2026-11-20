import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AngleDial } from ".";
import { normalizeAngle, pointerAngle } from "./angle";

describe("ángulo del dial", () => {
  it("0° arriba y en sentido horario, como en CSS", () => {
    expect(pointerAngle(0, -1)).toBe(0);
    expect(pointerAngle(1, 0)).toBe(90);
    expect(pointerAngle(0, 1)).toBe(180);
    expect(pointerAngle(-1, 0)).toBe(270);
  });

  it("con imán redondea a 15° y normaliza a 0–359", () => {
    expect(pointerAngle(1, -1.2, true)).toBe(45);
    expect(normalizeAngle(-10)).toBe(350);
    expect(normalizeAngle(360)).toBe(0);
  });
});

describe("AngleDial", () => {
  it("es un slider de teclado: ±1°, Shift ±15° y vuelta completa", () => {
    const onChange = vi.fn();
    render(<AngleDial value={359} onChange={onChange} />);
    const dial = screen.getByRole("slider", { name: "Ángulo" });
    expect(dial).toHaveAttribute("aria-valuetext", "359°");

    fireEvent.keyDown(dial, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(dial, { key: "ArrowLeft", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(344);
  });
});
