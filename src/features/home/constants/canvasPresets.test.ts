import { describe, expect, it } from "vitest";
import { CANVAS_SECTIONS } from "./canvasPresets";
import { NETWORK_ICONS } from "./networkIcons";

describe("CANVAS_SECTIONS", () => {
  it("no repite ningún tamaño ni ningún id en todo el inicio", () => {
    const presets = CANVAS_SECTIONS.flatMap((section) => section.presets);
    // "Pantalla" depende de la ventana: no cuenta como tamaño fijo.
    const sizes = presets
      .filter((preset) => preset.id !== "screen")
      .map((preset) => {
        const { width, height } = preset.size();
        return `${width}x${height}`;
      });
    expect(new Set(sizes).size).toBe(sizes.length);
    const ids = presets.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada red tiene su icono y las demás secciones no", () => {
    for (const section of CANVAS_SECTIONS) {
      expect(NETWORK_ICONS[section.id] !== undefined).toBe(
        section.network !== undefined
      );
    }
  });
});
