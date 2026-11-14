// Tests de caracterización: fijan el comportamiento ACTUAL de las utilidades
// para detectar regresiones al migrar/reescribir (Fases 1-2).
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  debounce,
  getDownloadFileName,
  reduceAspectRatioQualityOfIncomingImage,
} from "./helper";

describe("debounce", () => {
  afterEach(() => vi.useRealTimers());

  it("ejecuta solo la última llamada, después del retraso", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced("a");
    debounced("b");
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("b");
  });
});

describe("reduceAspectRatioQualityOfIncomingImage", () => {
  it("imagen horizontal: el ancho pasa a ser el máximo", () => {
    expect(
      reduceAspectRatioQualityOfIncomingImage({
        options: { width: 4000, height: 2000 },
        expectedMaxPixelsSize: 2048,
      })
    ).toEqual({ newWidth: 2048, newHeight: 1024 });
  });

  it("imagen vertical: el alto pasa a ser el máximo", () => {
    expect(
      reduceAspectRatioQualityOfIncomingImage({
        options: { width: 1000, height: 2000 },
        expectedMaxPixelsSize: 300,
      })
    ).toEqual({ newWidth: 150, newHeight: 300 });
  });
});

describe("getDownloadFileName", () => {
  it("añade la extensión según el tipo MIME", () => {
    expect(getDownloadFileName("mi dibujo", "image/jpeg")).toBe(
      "mi dibujo.jpg"
    );
    expect(getDownloadFileName("mi dibujo", "image/png")).toBe("mi dibujo.png");
  });

  it("respeta la extensión si el usuario ya la escribió", () => {
    expect(getDownloadFileName("foto.PNG", "image/png")).toBe("foto.PNG");
  });

  it("usa png y un nombre por defecto en casos raros", () => {
    expect(getDownloadFileName("  ", "image/gif")).toBe("imagen.png");
  });
});
