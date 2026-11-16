import { describe, expect, it } from "vitest";
import { baseName, isImageFile } from "./openImageFile";

describe("abrir una imagen", () => {
  it("el nombre sugerido es el del archivo sin extensión", () => {
    expect(baseName("playa.jpg")).toBe("playa");
    expect(baseName("mis.vacaciones.2026.png")).toBe("mis.vacaciones.2026");
    expect(baseName("sin-extension")).toBe("sin-extension");
    expect(baseName(".png")).toBeNull();
  });

  it("solo acepta imágenes", () => {
    expect(isImageFile(new File([""], "a.png", { type: "image/png" }))).toBe(
      true
    );
    expect(isImageFile(new File([""], "a.txt", { type: "text/plain" }))).toBe(
      false
    );
    expect(isImageFile(null)).toBe(false);
  });
});
