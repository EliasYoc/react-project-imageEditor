import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureFont, isFontReady, resetFontLoader } from "./fontLoader";
import { FONTS, SYSTEM_FONT_FAMILY, getFont } from "./fonts";
import { createDefaultTextStyle } from "../model/factories";
import {
  imageNodeConfig,
  textNodeConfig,
  textPadding,
  type TextNodeInput,
} from "./nodeConfig";
import { snapToDocument } from "./snapping";
import { newTextPosition, textEditingBox } from "./textEditorBox";

const text = (extra: Partial<TextNodeInput> = {}): TextNodeInput => ({
  ...createDefaultTextStyle(),
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
      fontFamily: "Pacifico, cursive",
      fontSize: 100,
      fontStyle: "900",
      fill: "rgba(255, 0, 0, 1)",
      width: undefined,
      align: "left",
      lineHeight: 1.15,
      padding: 15,
      strokeEnabled: false,
      shadowEnabled: false,
    });
    expect(textNodeConfig(text()).tag.fill).toBeUndefined();
    expect(textNodeConfig(text({ width: 400 })).text.width).toBe(400);
  });

  it("contorno por fuera, proporcional al tamaño de letra", () => {
    const config = textNodeConfig(
      text({
        stroke: {
          isEnabled: true,
          color: { r: 0, g: 0, b: 0, a: 1 },
          width: 0.1,
        },
      })
    ).text;
    expect(config).toMatchObject({
      strokeEnabled: true,
      stroke: "rgba(0, 0, 0, 1)",
      // 10 px visibles: la mitad interior del trazo la tapa el relleno.
      strokeWidth: 20,
      fillAfterStrokeEnabled: true,
    });
  });

  it("sombra con desenfoque y desplazamiento proporcionales", () => {
    const config = textNodeConfig(
      text({
        shadow: {
          isEnabled: true,
          color: { r: 0, g: 0, b: 0, a: 0.5 },
          blur: 0.2,
          offset: 0.05,
        },
      })
    ).text;
    expect(config).toMatchObject({
      shadowEnabled: true,
      shadowColor: "rgba(0, 0, 0, 0.5)",
      shadowBlur: 20,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
    });
  });

  it("caja de fondo: color y radio en el Tag, margen en el texto", () => {
    const element = text({
      align: "center",
      background: {
        isEnabled: true,
        color: { r: 255, g: 255, b: 0, a: 0.8 },
        padding: 0.3,
        radius: 0.25,
      },
    });
    const config = textNodeConfig(element);
    expect(config.tag).toMatchObject({
      fill: "rgba(255, 255, 0, 0.8)",
      cornerRadius: 25,
    });
    expect(config.text).toMatchObject({ padding: 30, align: "center" });
    expect(textPadding(element)).toBe(30);
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

describe("textEditingBox", () => {
  const area = { x: 0, y: 100, width: 400, height: 600 };

  it("coloca el editor horizontal, centrado y un poco por encima del centro de la zona libre", () => {
    const { scale, ...position } = textEditingBox(100, 0.5, area);
    expect(scale).toBe(0.5);
    expect(position).toEqual({
      left: 200,
      // A un 40 % del alto libre (600), contando desde donde empieza (100).
      top: 340,
      transform: "translateX(-50%) scale(0.5)",
      transformOrigin: "50% 0",
    });
  });

  it("centra en la parte libre cuando algo tapa los lados", () => {
    const { left } = textEditingBox(100, 1, {
      x: 50,
      y: 0,
      width: 300,
      height: 500,
    });
    expect(left).toBe(200);
  });

  it("se encoge si es más ancho que la zona libre (con su margen)", () => {
    // 400 de ancho menos 16 de margen por lado = 368 para un texto de 1000.
    const { scale } = textEditingBox(1000, 1, area);
    expect(scale).toBeCloseTo(0.368);
    expect(1000 * scale).toBeLessThanOrEqual(400 - 2 * 16);
  });

  it("no lo agranda: un texto que cabe se ve con su tamaño", () => {
    expect(textEditingBox(100, 0.3, area).scale).toBe(0.3);
  });

  it("sin zona medida (ancho 0) o sin ancho de texto, no lo encoge", () => {
    expect(textEditingBox(1000, 0.4, { ...area, width: 0 }).scale).toBe(0.4);
    expect(textEditingBox(0, 0.4, area).scale).toBe(0.4);
  });
});

describe("newTextPosition", () => {
  const view = { x: 50, y: 20, scale: 0.5 };

  it("lleva la esquina del texto a donde estaba el editor, para que no salte al terminar", () => {
    // El editor, de 120 de ancho, centrado en la pantalla en x = 200 y con su
    // borde de arriba en y = 100.
    const { x, y } = newTextPosition({ left: 200, top: 100 }, 120, 1, view);
    expect(x).toBe(240);
    expect(y).toBe(160);
    // Vuelto a la pantalla, el texto ocupa el mismo sitio que el editor.
    expect(x * view.scale + view.x).toBe(170);
    expect(170 + (120 * view.scale) / 2).toBe(200);
    expect(y * view.scale + view.y).toBe(100);
  });

  it("con la escala del elemento, el texto sigue centrado donde estaba el editor", () => {
    const { x } = newTextPosition({ left: 200, top: 100 }, 120, 2, view);
    // Ocupa 120 × 2 × 0,5 = 120 en pantalla: de 140 a 260.
    expect(x * view.scale + view.x).toBe(140);
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
    expect(load).toHaveBeenCalledWith("400 64px Pacifico, cursive");
    expect(isFontReady("pacifico", 400)).toBe(true);
  });

  it("si la fuente no está declarada, no la marca como lista", async () => {
    load.mockResolvedValue([]);
    expect(await ensureFont("kalam", 400)).toBe(false);
    expect(isFontReady("kalam", 400)).toBe(false);
  });
});
