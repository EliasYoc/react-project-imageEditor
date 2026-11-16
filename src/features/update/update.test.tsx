import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RegisterSWOptions } from "virtual:pwa-register";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStroke } from "../../editor/model/factories";
import {
  createInitialState,
  editorStore,
} from "../../editor/store/editorStore";
import UpdateButton from "./components/UpdateButton";
import { updateStore } from "./stores/updateStore";
import {
  CHECK_INTERVAL_MS,
  SETTLE_MS,
  registerUpdates,
} from "./utils/registerUpdates";

// El registro del service worker es de vite-plugin-pwa: aquí se simula.
const sw = vi.hoisted(() => ({
  options: {} as RegisterSWOptions,
  updateSW: vi.fn(async () => {}),
}));
vi.mock("virtual:pwa-register", () => ({
  registerSW: (options: RegisterSWOptions) => {
    sw.options = options;
    return sw.updateSW;
  },
}));

const state = () => editorStore.getState();

const addStroke = () =>
  state().addStroke({
    ...createStroke({
      brush: "pen",
      settings: { size: 10, opacity: 1, stabilizer: 0 },
      color: { r: 0, g: 0, b: 0, a: 1 },
    }),
    points: [{ x: 0, y: 0, pressure: 0.5 }],
  });

const isReady = () => updateStore.getState().isReady;

let hasFocus: ReturnType<typeof vi.spyOn>;
let stop: () => void = () => {};
const reload = vi.fn();
const start = async () => {
  stop = registerUpdates(reload);
  // Espera a que cargue el registro (se importa de forma dinámica).
  await vi.dynamicImportSettled();
};

beforeEach(() => {
  editorStore.setState(createInitialState());
  updateStore.setState({ isReady: false });
  sw.updateSW.mockClear();
  reload.mockClear();
  hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(true);
});

afterEach(() => {
  stop();
  hasFocus.mockRestore();
  vi.useRealTimers();
});

describe("registerUpdates", () => {
  it("en el inicio sin documento, la versión nueva se aplica sola", async () => {
    await start();
    sw.options.onNeedRefresh?.();
    expect(sw.updateSW).toHaveBeenCalledTimes(1);
    expect(isReady()).toBe(false);

    // El service worker nuevo toma el control: se recarga.
    sw.options.onNeedReload?.();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("con un dibujo abierto no recarga: ofrece Actualizar", async () => {
    state().setMode("draw");
    addStroke();
    await start();
    sw.options.onNeedRefresh?.();
    expect(sw.updateSW).not.toHaveBeenCalled();
    expect(isReady()).toBe(true);
  });

  it("mientras se elige una foto (la app sin foco), espera a volver", async () => {
    vi.useFakeTimers();
    hasFocus.mockReturnValue(false);
    await start();
    sw.options.onNeedRefresh?.();
    expect(sw.updateSW).not.toHaveBeenCalled();

    // Vuelve del selector y la foto empieza a abrirse: no recarga.
    hasFocus.mockReturnValue(true);
    window.dispatchEvent(new Event("focus"));
    state().setStatus("loading");
    vi.advanceTimersByTime(SETTLE_MS);
    expect(sw.updateSW).not.toHaveBeenCalled();

    // Si canceló (no eligió nada), sí.
    state().setStatus("idle");
    window.dispatchEvent(new Event("focus"));
    vi.advanceTimersByTime(SETTLE_MS);
    expect(sw.updateSW).toHaveBeenCalledTimes(1);
  });

  it("al volver al inicio sin documento, se aplica sola", async () => {
    vi.useFakeTimers();
    state().setMode("draw"); // un lienzo en blanco, sin nada
    await start();
    sw.options.onNeedRefresh?.();
    expect(isReady()).toBe(true);

    state().setMode("home");
    vi.advanceTimersByTime(SETTLE_MS);
    expect(sw.updateSW).toHaveBeenCalledTimes(1);
  });

  it("si otra pestaña la activa, con un dibujo abierto no recarga", async () => {
    state().setMode("draw");
    addStroke();
    await start();
    sw.options.onNeedReload?.();
    expect(reload).not.toHaveBeenCalled();
    expect(isReady()).toBe(true);
  });

  it("pregunta por versiones nuevas cada hora", async () => {
    vi.useFakeTimers();
    await start();
    const update = vi.fn(async () => undefined);
    sw.options.onRegisteredSW?.("/sw.js", {
      update,
    } as unknown as ServiceWorkerRegistration);
    vi.advanceTimersByTime(CHECK_INTERVAL_MS);
    expect(update).toHaveBeenCalledTimes(1);
  });
});

describe("UpdateButton", () => {
  const button = () =>
    screen.queryByRole("button", { name: "Actualizar a la versión nueva" });

  it("solo aparece si hay una versión nueva", async () => {
    await start();
    render(<UpdateButton />);
    expect(button()).toBeNull();
    act(() => sw.options.onNeedRefresh?.());
    // En el inicio sin documento se aplica sola: no hace falta el botón.
    expect(button()).toBeNull();

    state().setMode("draw");
    addStroke();
    act(() => sw.options.onNeedRefresh?.());
    expect(button()).toBeInTheDocument();
  });

  it("sin nada que perder, actualiza directamente", async () => {
    const user = userEvent.setup();
    state().setMode("draw");
    await start();
    act(() => sw.options.onNeedRefresh?.());
    render(<UpdateButton />);
    await user.click(button()!);
    expect(sw.updateSW).toHaveBeenCalledTimes(1);
  });

  it("con un dibujo, pide confirmación antes de perderlo", async () => {
    const user = userEvent.setup();
    state().setMode("draw");
    addStroke();
    await start();
    act(() => sw.options.onNeedRefresh?.());
    render(<UpdateButton />);

    await user.click(button()!);
    const dialog = screen.getByRole("alertdialog", {
      name: "¿Actualizar ahora?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "Se perderá el dibujo actual. Si quieres conservarlo, expórtalo antes."
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(sw.updateSW).not.toHaveBeenCalled();

    await user.click(button()!);
    await user.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(sw.updateSW).toHaveBeenCalledTimes(1);
  });
});
