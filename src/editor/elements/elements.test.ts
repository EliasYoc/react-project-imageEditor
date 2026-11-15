import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureFont, isFontReady, resetFontLoader } from "./fontLoader";
import { FONTS, SYSTEM_FONT_FAMILY, getFont } from "./fonts";
import {
  TEXT_LINE_HEIGHT,
  imageNodeConfig,
  textNodeConfig,
  type TextNodeInput,
} from "./nodeConfig";
import { snapToDocument } from "./snapping";
import { textEditorBox } from "./textEditorBox";

const text = (extra: Partial<TextNodeInput> = {}): TextNodeInput => ({
  id: "t1",
  x: 10,
  y: 20,
  rotation: 30,
  scale: 2,
  text: "Hola",
  fontId: "pacifico",
  fontSize: 100,
  fontWeight: 900,
  color: { r: 255, g: 0, b: 0, a: 1 },
  width: null,
  ...extra,
});

describe("fuentes", () => {
  it("cada id es único y la normal es la del sistema", () => {
    const ids = FONTS.map((font) => font.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getFont("normal").family).toBe(SYSTEM_FONT_FAMILY);
  });
});

describe("textNodeConfig", () => {
  it("lleva posición, giro y escala uniforme al grupo (Label)", () => {
    expect(textNodeConfig(text()).label).toEqual({
      id: "t1",
      x: 10,
      y: 20,
      rotation: 30,
      scaleX: 2,
      scaleY: 2,
    });
  });

  it("traduce el estilo a Konva: familia, peso, color y ancho automático", () => {
    expect(textNodeConfig(text()).text).toMatchObject({
      text: "Hola",
      fontFamily: "Pacifico",
      fontSize: 100,
      fontStyle: "900",
      fill: "rgba(255, 0, 0, 1)",
      width: undefined,
      lineHeight: TEXT_LINE_HEIGHT,
      padding: 15,
    });
    expect(textNodeConfig(text({ width: 400 })).text.width).toBe(400);
  });

  it("las imágenes llevan su tamaño en píxeles del documento", () => {
    expect(
      imageNodeConfig({
        id: "i1",
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1.5,
        width: 300,
        height: 200,
      })
    ).toMatchObject({ width: 300, height: 200, scaleX: 1.5, scaleY: 1.5 });
  });
});

describe("snapToDocument", () => {
  const doc = { width: 1000, height: 800 };

  it("ajusta el centro del elemento al centro del documento", () => {
    // Centro del elemento en (495, 300): a 5 px del centro horizontal.
    const result = snapToDocument(
      { x: 445, y: 250, width: 100, height: 100 },
      doc,
      8
    );
    expect(result.dx).toBe(5);
    expect(result.vertical).toEqual([500]);
    expect(result.dy).toBe(0);
    expect(result.horizontal).toEqual([]);
  });

  it("ajusta los bordes a los del documento y elige el más cercano", () => {
    const result = snapToDocument(
      { x: 3, y: 795 - 50, width: 200, height: 52 },
      doc,
      8
    );
    expect(result).toMatchObject({
      dx: -3,
      dy: 3,
      vertical: [0],
      horizontal: [800],
    });
  });

  it("fuera del umbral no ajusta", () => {
    expect(
      snapToDocument({ x: 100, y: 100, width: 50, height: 50 }, doc, 8)
    ).toEqual({ dx: 0, dy: 0, vertical: [], horizontal: [] });
  });
});

describe("textEditorBox", () => {
  it("coloca el textarea sobre el nodo con el giro y la escala de vista × elemento", () => {
    expect(textEditorBox(text(), { x: 50, y: 60, scale: 0.5 })).toEqual({
      left: 55,
      top: 70,
      transform: "rotate(30deg) scale(1)",
      transformOrigin: "0 0",
    });
  });
});

describe("ensureFont", () => {
  const load = vi.fn();

  beforeEach(() => {
    resetFontLoader();
    load.mockReset();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { load },
    });
  });
  afterEach(() => resetFontLoader());

  it("la fuente del sistema siempre está lista (no descarga nada)", async () => {
    expect(isFontReady("normal", 500)).toBe(true);
    expect(await ensureFont("normal", 500)).toBe(true);
    expect(load).not.toHaveBeenCalled();
  });

  it("descarga una vez aunque se pida varias veces a la vez", async () => {
    load.mockResolvedValue([{}]);
    const [a, b] = await Promise.all([
      ensureFont("pacifico", 400),
      ensureFont("pacifico", 400),
    ]);
    expect(a && b).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith("400 64px Pacifico");
    expect(isFontReady("pacifico", 400)).toBe(true);
  });

  it("si la fuente no está declarada, no la marca como lista", async () => {
    load.mockResolvedValue([]);
    expect(await ensureFont("kalam", 400)).toBe(false);
    expect(isFontReady("kalam", 400)).toBe(false);
  });
});
