import { describe, expect, it } from "vitest";
import { textEditingScale } from "./textEditorBox";

describe("textEditingScale", () => {
  it("un texto del tamaño por defecto se edita con la escala de la vista", () => {
    expect(textEditingScale(80, 80, 0.5)).toBe(0.5);
  });

  it("un texto más grande o más pequeño se edita al tamaño por defecto", () => {
    // 320 px × 0,125 = 40 px en pantalla, lo mismo que 80 px × 0,5.
    expect(textEditingScale(320, 80, 0.5)).toBe(0.125);
    expect(textEditingScale(20, 80, 0.5)).toBe(2);
  });
});
