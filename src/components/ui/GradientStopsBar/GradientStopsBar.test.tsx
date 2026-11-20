import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Gradient } from "../../../editor/model/types";
import { GradientStopsBar } from ".";

const gradient = (): Gradient => ({
  type: "linear",
  angle: 90,
  center: { x: 0.5, y: 0.25 },
  stops: [
    { id: "a", color: { r: 255, g: 0, b: 0, a: 1 }, offset: 0.2 },
    { id: "b", color: { r: 0, g: 0, b: 255, a: 0.5 }, offset: 1 },
  ],
});

describe("GradientStopsBar", () => {
  it("cada parada es un slider: las flechas la mueven (un solo paso al juntar) y Supr la quita", () => {
    const onChange = vi.fn();
    const many = {
      ...gradient(),
      stops: [
        ...gradient().stops,
        { id: "c", color: { r: 0, g: 255, b: 0, a: 1 }, offset: 0.5 },
      ],
    };
    render(
      <GradientStopsBar
        gradient={many}
        selectedId="a"
        onSelect={() => {}}
        onChange={onChange}
      />
    );
    const [first] = screen.getAllByRole("slider");
    expect(first).toHaveAttribute("aria-valuenow", "20");

    fireEvent.keyDown(first, { key: "ArrowRight", shiftKey: true });
    const [moved, mergeKey] = onChange.mock.calls[0];
    expect(moved.stops[0].offset).toBeCloseTo(0.3);
    expect(mergeKey).toBe("stop:a");

    fireEvent.keyDown(first, { key: "Delete" });
    expect(
      onChange.mock.calls[1][0].stops.map((stop: { id: string }) => stop.id)
    ).toEqual(["b", "c"]);
  });

  it("con solo 2 paradas no deja quitar ninguna", () => {
    const onChange = vi.fn();
    render(
      <GradientStopsBar
        gradient={gradient()}
        selectedId="a"
        onSelect={() => {}}
        onChange={onChange}
      />
    );
    fireEvent.keyDown(screen.getAllByRole("slider")[0], { key: "Delete" });
    expect(onChange).not.toHaveBeenCalled();
  });
});
