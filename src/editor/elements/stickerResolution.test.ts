import { describe, expect, it } from "vitest";
import { stickerResolution } from "./stickerResolution";

describe("stickerResolution", () => {
  it("usa la potencia de 2 que cubre lo que se ve en pantalla", () => {
    expect(stickerResolution(80)).toBe(128);
    expect(stickerResolution(128)).toBe(128);
    expect(stickerResolution(129)).toBe(256);
    expect(stickerResolution(600)).toBe(1024);
  });

  it("se queda entre 64 y 1024 píxeles", () => {
    expect(stickerResolution(0)).toBe(64);
    expect(stickerResolution(10)).toBe(64);
    expect(stickerResolution(5000)).toBe(1024);
  });
});
