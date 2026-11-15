import { describe, expect, it } from "vitest";
import { fitToMaxSide, getDownloadFileName } from "./helper";

describe("fitToMaxSide", () => {
  it("imagen horizontal: el ancho pasa a ser el máximo", () => {
    expect(fitToMaxSide({ width: 4000, height: 2000 }, 2048)).toEqual({
      width: 2048,
      height: 1024,
    });
  });

  it("imagen vertical: el alto pasa a ser el máximo", () => {
    expect(fitToMaxSide({ width: 1000, height: 2000 }, 300)).toEqual({
      width: 150,
      height: 300,
    });
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
