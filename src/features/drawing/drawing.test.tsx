import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { BRUSH_SIZE_RANGE } from "../../editor/model/factories";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import BrushLibrary from "./components/BrushLibrary/BrushLibrary";
import ModeSwitcher from "./components/ModeSwitcher/ModeSwitcher";
import {
  PREVIEW_SIZE,
  previewPoints,
  previewStroke,
  previewStrokeSize,
} from "./utils/previewStroke";
import { SLIDER_STEPS, sizeToSlider, sliderToSize } from "./utils/sizeScale";

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
    expect(
      screen.getAllByRole("button", { pressed: false }).length +
        screen.getAllByRole("button", { pressed: true }).length
    ).toBe(13);
  });

  it("los pinceles nuevos van al final de Dibujo, sin mover los anteriores", () => {
    render(<BrushLibrary />);
    const drawing = screen.getByRole("region", { name: "Dibujo" });
    expect(
      within(drawing)
        .getAllByRole("button", { pressed: false })
        .concat(within(drawing).getAllByRole("button", { pressed: true }))
        .sort((a, b) =>
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1
        )
        .map((button) => button.textContent)
    ).toEqual([
      "Pluma",
      "Marcador",
      "Lápiz",
      "Tiza",
      "Aerógrafo",
      "Spray",
      "Resaltador",
      "Caligrafía",
      "Neón",
      "Formas",
      "Desenfoque",
    ]);
  });

  it("elegir un pincel lo activa y muestra sus ajustes", async () => {
    render(<BrushLibrary />);
    await userEvent.click(screen.getByRole("button", { name: "Tiza" }));
    expect(editorStore.getState().brush.presetId).toBe("chalk");
    expect(
      screen.getByRole("region", { name: "Ajustes de Tiza" })
    ).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Tamaño" })).toHaveAttribute(
      "aria-valuetext",
      "40 px"
    );
  });

  it("cada pincel tiene su vista previa (oculta a los lectores de pantalla)", () => {
    const { container } = render(<BrushLibrary />);
    const previews = container.querySelectorAll('canvas[aria-hidden="true"]');
    expect(previews).toHaveLength(13);
  });

  it("el Desenfoque está entre los pinceles de dibujo, con los mismos ajustes", async () => {
    render(<BrushLibrary />);
    const drawing = screen.getByRole("region", { name: "Dibujo" });
    await userEvent.click(
      within(drawing).getByRole("button", { name: "Desenfoque" })
    );
    expect(editorStore.getState().brush.presetId).toBe("blur");
    expect(
      within(
        screen.getByRole("region", { name: "Ajustes de Desenfoque" })
      ).getAllByRole("slider")
    ).toHaveLength(3);
  });

  it("solo el pincel de formas tiene botón de más opciones", () => {
    render(<BrushLibrary />);
    expect(
      screen.getAllByRole("button", { name: /^Más opciones/ })
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Más opciones de Formas" })
    ).toBeInTheDocument();
  });

  it("más opciones ofrece las cinco figuras, con la actual marcada", async () => {
    const user = userEvent.setup();
    render(<BrushLibrary />);
    await user.click(
      screen.getByRole("button", { name: "Más opciones de Formas" })
    );
    const options = screen.getAllByRole("menuitemradio");
    expect(options.map((option) => option.textContent)).toEqual([
      "Círculos",
      "Cuadrados",
      "Triángulos",
      "Estrellas",
      "Mezcla",
    ]);
    expect(
      screen.getByRole("menuitemradio", { name: "Círculos" })
    ).toHaveAttribute("aria-checked", "true");
  });

  it("elegir una figura la guarda y activa el pincel de formas", async () => {
    const user = userEvent.setup();
    render(<BrushLibrary />);
    expect(editorStore.getState().brush.presetId).toBe("pen");
    await user.click(
      screen.getByRole("button", { name: "Más opciones de Formas" })
    );
    await user.click(screen.getByRole("menuitemradio", { name: "Estrellas" }));

    const { brush } = editorStore.getState();
    expect(brush.shape).toBe("star");
    expect(brush.presetId).toBe("shapes");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Formas" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("los sliders cambian los ajustes solo del pincel actual", () => {
    render(<BrushLibrary />);
    fireEvent.change(screen.getByRole("slider", { name: "Opacidad" }), {
      target: { value: "35" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Estabilización" }), {
      target: { value: "80" },
    });
    const { settings } = editorStore.getState().brush;
    expect(settings.pen).toMatchObject({ opacity: 0.35, stabilizer: 0.8 });
    expect(settings.marker.opacity).toBe(1);
    expect(screen.getByRole("slider", { name: "Opacidad" })).toHaveAttribute(
      "aria-valuetext",
      "35 %"
    );
  });
});

describe("vista previa de los pinceles", () => {
  it("es una curva en S dentro de la tarjeta, con presión que sube y baja", () => {
    const points = previewPoints();
    for (const { x, y } of points) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(PREVIEW_SIZE.width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(PREVIEW_SIZE.height);
    }
    const pressures = points.map((p) => p.pressure);
    const middle = pressures[Math.floor(pressures.length / 2)];
    expect(middle).toBeGreaterThan(pressures[0]);
    expect(middle).toBeGreaterThan(pressures.at(-1)!);
  });

  it("reduce el tamaño para que quepa, conservando el orden", () => {
    const sizes = [1, 6, 16, 40, 120, 200].map(previewStrokeSize);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
    }
    expect(sizes.at(-1)).toBeLessThan(PREVIEW_SIZE.height / 2);
  });

  it("usa los ajustes y el color del preset, con presión", () => {
    const stroke = previewStroke(
      "marker",
      { size: 40, opacity: 0.5, stabilizer: 0 },
      { r: 1, g: 2, b: 3, a: 1 }
    );
    expect(stroke).toMatchObject({
      brush: "marker",
      opacity: 0.5,
      hasPressure: true,
      color: { r: 1, g: 2, b: 3 },
    });
  });

  it("la del pincel de formas usa la figura elegida", () => {
    const stroke = previewStroke(
      "shapes",
      { size: 40, opacity: 1, stabilizer: 0 },
      { r: 0, g: 0, b: 0, a: 1 },
      "star"
    );
    expect(stroke.shape).toBe("star");
  });
});

describe("selector de modo", () => {
  it("con iconOnly muestra solo los iconos y conserva el nombre accesible", () => {
    render(<ModeSwitcher iconOnly />);
    const group = screen.getByRole("radiogroup", { name: "Modo" });
    expect(within(group).getByRole("radio", { name: "Dibujar" })).toBeVisible();
    expect(within(group).getByRole("radio", { name: "Texto" })).toBeVisible();
    // Sin el texto dentro del botón: solo está el `aria-label`.
    expect(group.querySelector("span")).toBeNull();
  });

  it("sin iconOnly muestra el texto de cada modo", () => {
    render(<ModeSwitcher />);
    expect(screen.getByText("Dibujar")).toBeInTheDocument();
    expect(screen.getByText("Texto")).toBeInTheDocument();
  });
});
