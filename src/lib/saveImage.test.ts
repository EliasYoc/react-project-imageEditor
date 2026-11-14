import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "./helper";
import { saveImage } from "./saveImage";

vi.mock("./helper", () => ({ downloadBlob: vi.fn() }));

const blob = new Blob(["x"], { type: "image/png" });

/** Simula el dispositivo: puntero táctil o no, y qué hace navigator.share. */
const setDevice = ({
  touch,
  canShare = true,
  share = vi.fn().mockResolvedValue(undefined),
}: {
  touch: boolean;
  canShare?: boolean;
  share?: ReturnType<typeof vi.fn>;
}) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: touch && query === "(pointer: coarse)",
  }));
  Object.assign(navigator, { canShare: () => canShare, share });
  return share;
};

beforeEach(() => vi.mocked(downloadBlob).mockClear());
afterEach(() => vi.unstubAllGlobals());

describe("saveImage", () => {
  it("en el escritorio descarga, aunque se pueda compartir", async () => {
    const share = setDevice({ touch: false });
    expect(await saveImage(blob, "a.png")).toBe("downloaded");
    expect(share).not.toHaveBeenCalled();
    expect(downloadBlob).toHaveBeenCalledWith(blob, "a.png");
  });

  it("en el móvil abre la hoja de compartir con el archivo", async () => {
    const share = setDevice({ touch: true });
    expect(await saveImage(blob, "a.png")).toBe("shared");
    const [{ files }] = share.mock.calls[0];
    expect(files[0]).toMatchObject({ name: "a.png", type: "image/png" });
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it("si el usuario cierra la hoja, no descarga", async () => {
    setDevice({
      touch: true,
      share: vi.fn().mockRejectedValue(new DOMException("", "AbortError")),
    });
    expect(await saveImage(blob, "a.png")).toBe("cancelled");
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it("si el navegador rechaza compartir (tardó demasiado), descarga", async () => {
    setDevice({
      touch: true,
      share: vi.fn().mockRejectedValue(new DOMException("", "NotAllowedError")),
    });
    expect(await saveImage(blob, "a.png")).toBe("downloaded");
    expect(downloadBlob).toHaveBeenCalled();
  });

  it("si no se pueden compartir archivos, descarga", async () => {
    setDevice({ touch: true, canShare: false });
    expect(await saveImage(blob, "a.png")).toBe("downloaded");
  });
});
