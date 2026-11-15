import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { gradientToCss, stopsToCss } from "../../editor/engine/fill/css";
import type { Gradient } from "../../editor/model/types";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import AngleDial from "./AngleDial";
import BackdropPanel from "./BackdropPanel";
import GradientStopsBar from "./GradientStopsBar";
import { normalizeAngle, pointerAngle } from "./angle";

const gradient = (): Gradient => ({
  type: "linear",
  angle: 90,
  center: { x: 0.5, y: 0.25 },
  stops: [
    { id: "a", color: { r: 255, g: 0, b: 0, a: 1 }, offset: 0.2 },
    { id: "b", color: { r: 0, g: 0, b: 255, a: 0.5 }, offset: 1 },
  ],
});

describe("gradientToCss", () => {
  it("lineal, radial y cónico con la sintaxis de CSS", () => {
    const stops = "rgba(255, 0, 0, 1) 20%, rgba(0, 0, 255, 0.5) 100%";
    expect(gradientToCss(gradient())).toBe(`linear-gradient(90deg, ${stops})`);
    expect(gradientToCss({ ...gradient(), type: "radial" })).toBe(
      `radial-gradient(ellipse farthest-corner at 50% 25%, ${stops})`
    );
    expect(gradientToCss({ ...gradient(), type: "conic" })).toBe(
      `conic-gradient(from 90deg at 50% 25%, ${stops})`
    );
    expect(stopsToCss(gradient().stops)).toBe(
      `linear-gradient(90deg, ${stops})`
    );
  });
});

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

describe("BackdropPanel", () => {
  beforeEach(() => {
    editorStore.setState({ ...createInitialState(), mode: "draw" });
  });

  it("las pestañas ponen color, degradado o nada (cada una es un paso del historial)", async () => {
    render(<BackdropPanel />);
    await userEvent.click(screen.getByRole("radio", { name: "Color" }));
    expect(editorStore.getState().backdrop.fill?.kind).toBe("color");

    await userEvent.click(screen.getByRole("radio", { name: "Degradado" }));
    expect(editorStore.getState().backdrop.fill?.kind).toBe("gradient");
    expect(screen.getByRole("slider", { name: "Ángulo" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Ninguno" }));
    expect(editorStore.getState().backdrop.fill).toBeNull();
    expect(editorStore.getState().past).toHaveLength(3);
  });

  it("un preset cambia el degradado; la forma radial no tiene ángulo", async () => {
    render(<BackdropPanel />);
    await userEvent.click(screen.getByRole("radio", { name: "Degradado" }));
    await userEvent.click(screen.getByRole("button", { name: "Fuego" }));
    const { fill } = editorStore.getState().backdrop;
    expect(fill?.kind === "gradient" && fill.gradient.type).toBe("radial");
    expect(screen.queryByRole("slider", { name: "Ángulo" })).toBeNull();
  });

  it("el modo de fusión solo aparece con una foto", async () => {
    const { unmount } = render(<BackdropPanel />);
    await userEvent.click(screen.getByRole("radio", { name: "Color" }));
    expect(screen.queryByLabelText("Modo de fusión")).toBeNull();
    unmount();

    editorStore.setState({
      photo: {
        source: document.createElement("canvas"),
        preview: null,
        mimeType: "image/png",
        fileName: "foto",
      },
    });
    render(<BackdropPanel />);
    await userEvent.selectOptions(
      screen.getByLabelText("Modo de fusión"),
      "multiply"
    );
    expect(editorStore.getState().backdrop.blend).toBe("multiply");
  });
});
