import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BRUSH_SIZE_RANGE } from "../../editor/model/factories";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import BrushLibrary from "./BrushLibrary";
import { SLIDER_STEPS, sizeToSlider, sliderToSize } from "./sizeScale";

describe("escala del slider de tamaño", () => {
  it("los extremos del slider son el tamaño mínimo y el máximo", () => {
    expect(sliderToSize(0, BRUSH_SIZE_RANGE)).toBe(1);
    expect(sliderToSize(SLIDER_STEPS, BRUSH_SIZE_RANGE)).toBe(200);
  });

  it("la mitad del slider da tamaños pequeños (escala cuadrática)", () => {
    expect(sliderToSize(SLIDER_STEPS / 2, BRUSH_SIZE_RANGE)).toBe(51);
  });

  it("ida y vuelta conserva el tamaño", () => {
    for (const size of [1, 2, 5, 16, 40, 120, 200]) {
      expect(
        sliderToSize(sizeToSlider(size, BRUSH_SIZE_RANGE), BRUSH_SIZE_RANGE)
      ).toBe(size);
    }
  });
});

describe("BrushLibrary", () => {
  beforeEach(() => {
    editorStore.setState({ ...createInitialState(), mode: "draw" });
  });

  it("muestra los pinceles por secciones y marca el actual", () => {
    render(<BrushLibrary />);
    expect(screen.getByRole("region", { name: "Dibujo" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Borradores" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pluma" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getAllByRole("button")).toHaveLength(9);
  });

  it("elegir un pincel lo activa y avisa (para cerrar la hoja)", async () => {
    const onSelect = vi.fn();
    render(<BrushLibrary onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Tiza" }));
    expect(editorStore.getState().brush.presetId).toBe("chalk");
    expect(onSelect).toHaveBeenCalled();
  });
});
