import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, toastStore } from "../../components/ui/Toast";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import { createFakeVideoSource, mockObjectUrls } from "../../test/video";
import ExportDialog from "./components/ExportDialog/ExportDialog";
import type { EncodeVideoResult } from "./utils/encodeVideo";
import { defaultExportName } from "./utils/exportName";
import type { ExportVideoOptions } from "./utils/exportVideo";

const { exportVideo, exportAnimation } = vi.hoisted(() => ({
  exportVideo: vi.fn(),
  exportAnimation: vi.fn(),
}));
vi.mock("./utils/exportVideo", () => ({ exportVideo, exportAnimation }));

const save = vi.hoisted(() => ({ saveImage: vi.fn(), sharesFile: vi.fn() }));
vi.mock("../../lib/saveImage", () => save);

const state = () => editorStore.getState();
const mp4 = new Blob(["video"], { type: "video/mp4" });
const done: EncodeVideoResult = {
  status: "done",
  blob: mp4,
  hasLostSound: false,
};

/** La exportación en curso: su avance, su señal y cómo terminarla. */
interface RunningExport extends ExportVideoOptions {
  finish: (result: EncodeVideoResult) => void;
  fail: (error: Error) => void;
}
let running: RunningExport | null = null;

/** El diálogo abierto, como lo usa la cabecera. Devuelve si sigue abierto. */
const renderDialog = () => {
  const isOpen = { current: true };
  const Harness = () => {
    const [open, setOpen] = useState(true);
    isOpen.current = open;
    return (
      <>
        <ExportDialog open={open} onOpenChange={setOpen} />
        <Toaster />
      </>
    );
  };
  render(<Harness />);
  return isOpen;
};

const videoDialog = () =>
  screen.findByRole("dialog", { name: "Exportar video" });

/** Abre el diálogo y pulsa Exportar: la exportación queda en curso. */
const startExport = async (user: ReturnType<typeof userEvent.setup>) => {
  const isOpen = renderDialog();
  const dialog = await videoDialog();
  await user.click(within(dialog).getByRole("button", { name: "Exportar" }));
  if (!running) throw new Error("La exportación no empezó");
  return { isOpen, dialog, running };
};

beforeEach(() => {
  mockObjectUrls();
  editorStore.setState({
    ...createInitialState(),
    mode: "draw",
    canvasSize: { width: 1280, height: 720 },
    photo: {
      source: null,
      preview: null,
      mimeType: null,
      fileName: "fiesta",
      video: createFakeVideoSource(),
    },
  });
  toastStore.setState({ toasts: [] });
  running = null;
  // Las dos exportaciones de video quedan en curso hasta que el test diga.
  const startRunning = (options: ExportVideoOptions) =>
    new Promise<EncodeVideoResult>((finish, fail) => {
      running = { ...options, finish, fail };
    });
  for (const exportFn of [exportVideo, exportAnimation]) {
    exportFn.mockReset();
    exportFn.mockImplementation(startRunning);
  }
  save.saveImage.mockReset();
  save.saveImage.mockResolvedValue("downloaded");
  save.sharesFile.mockReset();
  save.sharesFile.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "userActivation");
});

describe("nombre sugerido de un video", () => {
  it("es el del archivo + -editado, o video-editado con la fecha", () => {
    expect(
      defaultExportName({ hasPhoto: false, isVideo: true, fileName: "fiesta" })
    ).toBe("fiesta-editado");
    expect(
      defaultExportName(
        { hasPhoto: false, isVideo: true, fileName: null },
        new Date(2026, 0, 5, 23, 30)
      )
    ).toBe("video-editado-2026-01-05");
  });
});

describe("exportar un video", () => {
  it("el diálogo dice que sale un MP4, de qué tamaño, y sugiere el nombre", async () => {
    renderDialog();
    const dialog = await videoDialog();
    expect(dialog).toHaveAccessibleDescription(
      "Se guarda en MP4 a 1280 × 720 px, con su sonido."
    );
    expect(
      within(dialog).getByRole("textbox", { name: "Nombre del archivo" })
    ).toHaveValue("fiesta-editado");
    expect(within(dialog).getByText(".mp4")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Exportar imagen" })
    ).toBeNull();
  });

  it("muestra el avance y, al terminar, descarga el video y avisa", async () => {
    const user = userEvent.setup();
    const { isOpen, dialog, running } = await startExport(user);
    expect(state().status).toBe("exportingVideo");
    expect(within(dialog).getByText("Exportando el video… 0 %")).toBeVisible();

    act(() => running.onProgress(0.42));
    expect(within(dialog).getByText("Exportando el video… 42 %")).toBeVisible();
    expect(within(dialog).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "42"
    );

    await act(async () => running.finish(done));
    expect(save.saveImage).toHaveBeenCalledWith(mp4, "fiesta-editado.mp4");
    expect(
      await screen.findByText("Video descargado: fiesta-editado.mp4")
    ).toBeInTheDocument();
    expect(isOpen.current).toBe(false);
    expect(state().status).toBe("idle");
  });

  it("usa el nombre que se escriba", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = await videoDialog();
    const input = within(dialog).getByRole("textbox", {
      name: "Nombre del archivo",
    });
    await user.clear(input);
    await user.type(input, "cumple de Ana{Enter}");
    await act(async () => running?.finish(done));
    expect(save.saveImage).toHaveBeenCalledWith(mp4, "cumple de Ana.mp4");
  });

  it("mientras exporta no se cierra con Escape; Cancelar la detiene", async () => {
    const user = userEvent.setup();
    const { isOpen, dialog, running } = await startExport(user);
    await user.keyboard("{Escape}");
    expect(isOpen.current).toBe(true);
    expect(running.signal.aborted).toBe(false);

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(running.signal.aborted).toBe(true);
    await act(async () => running.finish({ status: "canceled" }));
    expect(isOpen.current).toBe(false);
    expect(save.saveImage).not.toHaveBeenCalled();
    expect(toastStore.getState().toasts).toEqual([]);
    expect(state().status).toBe("idle");
  });

  it("avisa si el navegador no puede exportar ese video", async () => {
    const user = userEvent.setup();
    const { isOpen, running } = await startExport(user);
    await act(async () => running.finish({ status: "unsupported" }));
    expect(
      await screen.findByText("Este navegador no puede exportar este video")
    ).toBeInTheDocument();
    expect(isOpen.current).toBe(false);
    expect(save.saveImage).not.toHaveBeenCalled();
  });

  it("avisa si la exportación falla", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const { isOpen, running } = await startExport(user);
    await act(async () => running.fail(new Error("sin memoria")));
    expect(
      await screen.findByText("No se pudo exportar el video")
    ).toBeInTheDocument();
    expect(isOpen.current).toBe(false);
    expect(state().status).toBe("idle");
  });

  it("avisa si el video sale sin su sonido, y lo entrega igual", async () => {
    const user = userEvent.setup();
    const { running } = await startExport(user);
    await act(async () => running.finish({ ...done, hasLostSound: true }));
    expect(
      await screen.findByText("El video se exportó sin sonido")
    ).toBeInTheDocument();
    expect(save.saveImage).toHaveBeenCalled();
  });

  it("en el móvil, si la exportación tardó, pide un toque para compartir", async () => {
    save.sharesFile.mockReturnValue(true);
    save.saveImage.mockResolvedValue("shared");
    const user = userEvent.setup();
    const { isOpen, dialog, running } = await startExport(user);
    await act(async () => running.finish(done));

    // La hoja de compartir necesita un toque reciente: aún no se ha abierto.
    expect(save.saveImage).not.toHaveBeenCalled();
    expect(within(dialog).getByText("El video está listo.")).toBeVisible();
    expect(isOpen.current).toBe(true);

    await user.click(
      within(dialog).getByRole("button", { name: "Compartir o guardar" })
    );
    expect(save.saveImage).toHaveBeenCalledWith(mp4, "fiesta-editado.mp4");
    expect(isOpen.current).toBe(false);
    // Con la hoja de compartir, el sistema ya da su respuesta: sin aviso.
    expect(toastStore.getState().toasts).toEqual([]);
  });

  it("si se cierra la hoja de compartir, el video sigue listo para reintentarlo", async () => {
    save.sharesFile.mockReturnValue(true);
    save.saveImage.mockResolvedValue("cancelled");
    const user = userEvent.setup();
    const { isOpen, dialog, running } = await startExport(user);
    await act(async () => running.finish(done));
    await user.click(
      within(dialog).getByRole("button", { name: "Compartir o guardar" })
    );
    expect(isOpen.current).toBe(true);
    expect(within(dialog).getByText("El video está listo.")).toBeVisible();
  });

  it("con un GIF encima, exporta el video del documento", async () => {
    state().addImage({
      src: "blob:gif",
      width: 64,
      height: 64,
      center: { x: 640, y: 360 },
      animation: "frames",
    });
    const user = userEvent.setup();
    await startExport(user);
    expect(exportVideo).toHaveBeenCalled();
    expect(exportAnimation).not.toHaveBeenCalled();
  });

  it("en el móvil, si el toque de Exportar aún vale, comparte sin más pasos", async () => {
    save.sharesFile.mockReturnValue(true);
    save.saveImage.mockResolvedValue("shared");
    Object.defineProperty(navigator, "userActivation", {
      configurable: true,
      value: { isActive: true },
    });
    const user = userEvent.setup();
    const { isOpen, running } = await startExport(user);
    await act(async () => running.finish(done));
    expect(save.saveImage).toHaveBeenCalledWith(mp4, "fiesta-editado.mp4");
    expect(isOpen.current).toBe(false);
  });
});

describe("exportar un lienzo con GIFs", () => {
  /** El título es solo «Exportar»: la opción marcada dice imagen o video. */
  const animatedDialog = () =>
    screen.findByRole("dialog", { name: "Exportar" });

  beforeEach(() => {
    editorStore.setState({
      ...createInitialState(),
      mode: "text",
      canvasSize: { width: 1080, height: 1080 },
    });
    state().addImage({
      src: "blob:gif",
      width: 64,
      height: 64,
      center: { x: 540, y: 540 },
      animation: "frames",
    });
  });

  it("deja elegir imagen o video; empieza en un video de 15 s sin sonido", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = await animatedDialog();
    expect(dialog).toHaveAccessibleDescription(
      "Se guarda en MP4 a 1080 × 1080 px, 15 segundos, sin sonido."
    );
    expect(within(dialog).getByRole("radio", { name: "Video" })).toBeChecked();
    expect(await within(dialog).findByText(".mp4")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("radio", { name: "Imagen" }));
    expect(dialog).toHaveAccessibleName("Exportar");
    expect(dialog).toHaveAccessibleDescription("Se guarda a 1080 × 1080 px.");
    expect(within(dialog).getByText(".png")).toBeInTheDocument();
  });

  it("como video, compone el de los GIFs y lo descarga como dibujo-fecha.mp4", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = await animatedDialog();
    await user.click(
      await within(dialog).findByRole("button", { name: "Exportar" })
    );
    expect(exportAnimation).toHaveBeenCalled();
    expect(exportVideo).not.toHaveBeenCalled();
    // Mientras exporta no se puede cambiar a imagen.
    expect(within(dialog).queryByRole("radio")).toBeNull();

    await act(async () => running?.finish(done));
    expect(save.saveImage).toHaveBeenCalledWith(
      mp4,
      expect.stringMatching(/^dibujo-\d{4}-\d{2}-\d{2}\.mp4$/)
    );
  });
});
