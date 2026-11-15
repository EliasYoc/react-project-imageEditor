import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStroke } from "../../editor/model/factories";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import HomeScreen from "./HomeScreen";

const openImageFile = vi.hoisted(() => vi.fn());
vi.mock("./openImageFile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./openImageFile")>()),
  openImageFile,
}));

const state = () => editorStore.getState();

const photoFrom = (name: string) => ({
  source: document.createElement("canvas"),
  preview: document.createElement("canvas"),
  mimeType: "image/png",
  fileName: name,
  size: { width: 640, height: 480 },
});

const addStroke = () =>
  state().addStroke({
    ...createStroke({
      brush: "pen",
      settings: { size: 10, opacity: 1, stabilizer: 0 },
      color: { r: 0, g: 0, b: 0, a: 1 },
    }),
    points: [{ x: 0, y: 0, pressure: 0.5 }],
  });

const image = new File(["x"], "playa.png", { type: "image/png" });

beforeEach(() => {
  editorStore.setState(createInitialState());
  openImageFile.mockReset();
  openImageFile.mockImplementation(async (file: File) =>
    photoFrom(file.name.replace(/\..*$/, ""))
  );
});

describe("pantalla de inicio", () => {
  it("sin documento: no ofrece seguir y un tamaño crea el lienzo y abre el editor", async () => {
    const user = userEvent.setup();
    render(<HomeScreen />);
    expect(
      screen.queryByRole("button", { name: /Seguir editando/ })
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Historia, 1080 × 1920 píxeles" })
    );
    expect(state().canvasSize).toEqual({ width: 1080, height: 1920 });
    expect(state().mode).toBe("draw");
  });

  it("con documento: seguir editando vuelve al editor sin tocar nada", async () => {
    const user = userEvent.setup();
    addStroke();
    render(<HomeScreen />);
    await user.click(screen.getByRole("button", { name: /Seguir editando/ }));
    expect(state().mode).toBe("draw");
    expect(state().log).toHaveLength(1);
  });

  it("con documento: empezar otro pide confirmación y Cancelar no borra nada", async () => {
    const user = userEvent.setup();
    addStroke();
    render(<HomeScreen />);
    await user.click(
      screen.getByRole("button", { name: "Cuadrado, 2048 × 2048 píxeles" })
    );
    const dialog = screen.getByRole("alertdialog", {
      name: "¿Empezar de nuevo?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "Se descartará el documento actual y su historial (no se puede deshacer)."
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(state().log).toHaveLength(1);
    expect(state().mode).toBe("home");

    await user.click(
      screen.getByRole("button", { name: "Cuadrado, 2048 × 2048 píxeles" })
    );
    await user.click(screen.getByRole("button", { name: "Descartar y abrir" }));
    expect(state().log).toHaveLength(0);
    expect(state().canvasSize).toEqual({ width: 2048, height: 2048 });
  });

  it("soltar una imagen sobre la ventana la abre (y avisa mientras se arrastra)", async () => {
    render(<HomeScreen />);
    const dataTransfer = { types: ["Files"], files: [image] };
    fireEvent.dragEnter(window, { dataTransfer });
    expect(
      await screen.findByText("Suelta la imagen para abrirla")
    ).toBeInTheDocument();

    fireEvent.drop(window, { dataTransfer });
    await waitFor(() => expect(state().mode).toBe("draw"));
    expect(openImageFile).toHaveBeenCalledWith(image);
    expect(state().photo.fileName).toBe("playa");
    expect(screen.queryByText("Suelta la imagen para abrirla")).toBeNull();
  });

  it("pegar una imagen la abre; soltar algo que no es una imagen no hace nada", async () => {
    render(<HomeScreen />);
    fireEvent.drop(window, {
      dataTransfer: {
        types: ["Files"],
        files: [new File(["x"], "nota.txt", { type: "text/plain" })],
      },
    });
    expect(openImageFile).not.toHaveBeenCalled();

    fireEvent.paste(window, { clipboardData: { files: [image] } });
    await waitFor(() => expect(state().mode).toBe("draw"));
    expect(openImageFile).toHaveBeenCalledWith(image);
  });

  it("soltar una imagen con un documento abierto también pide confirmación", async () => {
    const user = userEvent.setup();
    addStroke();
    render(<HomeScreen />);
    fireEvent.drop(window, {
      dataTransfer: { types: ["Files"], files: [image] },
    });
    expect(openImageFile).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Descartar y abrir" }));
    await waitFor(() => expect(openImageFile).toHaveBeenCalledWith(image));
  });
});
