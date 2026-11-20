import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { gradientToCss, stopsToCss } from "../../editor/engine/fill/css";
import type { Gradient } from "../../editor/model/types";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import { createFakeVideoSource, mockObjectUrls } from "../../test/video";
import BackdropPanel from "./components/BackdropPanel/BackdropPanel";

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

describe("BackdropPanel", () => {
  beforeEach(() => {
    mockObjectUrls();
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

  it("«Quitar parada» va justo debajo de la barra de paradas, antes del color", async () => {
    render(<BackdropPanel />);
    await userEvent.click(screen.getByRole("radio", { name: "Degradado" }));
    const stop = screen.getAllByRole("slider", { name: /parada/i })[0];
    const remove = screen.getByRole("button", { name: "Quitar parada" });
    const colorField = screen.getByRole("slider", { name: /matiz|hue/i });
    const before = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(before(stop, remove)).toBe(true);
    expect(before(remove, colorField)).toBe(true);
  });

  it("la vista previa del degradado tiene la forma del lienzo (vertical, cuadrado u horizontal)", async () => {
    render(<BackdropPanel />);
    await userEvent.click(screen.getByRole("radio", { name: "Degradado" }));
    const preview = () =>
      screen.getByLabelText(/Centro del degradado|Vista previa/);
    const withCanvas = (width: number, height: number) =>
      act(() => editorStore.setState({ canvasSize: { width, height } }));

    withCanvas(1080, 1920);
    expect(preview().style.aspectRatio).toBe("1080 / 1920");
    expect(preview()).toHaveAttribute("data-portrait");

    withCanvas(1080, 1080);
    expect(preview()).not.toHaveAttribute("data-portrait");

    withCanvas(1920, 1080);
    expect(preview().style.aspectRatio).toBe("1920 / 1080");
    expect(preview()).not.toHaveAttribute("data-portrait");
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
        video: null,
      },
    });
    render(<BackdropPanel />);
    await userEvent.selectOptions(
      screen.getByLabelText("Modo de fusión"),
      "multiply"
    );
    expect(editorStore.getState().backdrop.blend).toBe("multiply");
  });

  it("con un video de fondo, los textos hablan del video", async () => {
    editorStore.setState({
      photo: {
        source: null,
        preview: null,
        mimeType: null,
        fileName: "clip",
        video: createFakeVideoSource(),
      },
    });
    render(<BackdropPanel />);
    expect(screen.getByText(/^El video se ve tal cual\./)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Color" }));
    expect(
      screen.getByRole("heading", { name: "Sobre el video" })
    ).toBeInTheDocument();
    // Como sobre una foto, la capa de color se puede fundir con el video.
    expect(screen.getByLabelText("Modo de fusión")).toBeInTheDocument();
  });
});
