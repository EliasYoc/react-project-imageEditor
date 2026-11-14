import { describe, expect, it } from "vitest";
import {
  IDENTITY_VIEW,
  documentRectOnScreen,
  documentToScreen,
  fitView,
  screenToDocument,
} from "./viewport";

// Los mismos casos que fijaban el comportamiento del lienzo legacy
// (getCalculatedCoordsOfContainCanvas): el resultado no debe cambiar.
describe("fitView", () => {
  it("documento cuadrado en un área vertical: manda el ancho y se centra en vertical", () => {
    expect(
      fitView({ width: 500, height: 1000 }, { width: 1000, height: 1000 })
    ).toEqual({ scale: 0.5, x: 0, y: 250 });
  });

  it("documento cuadrado en un área horizontal: manda el alto y se centra en horizontal", () => {
    expect(
      fitView({ width: 1000, height: 500 }, { width: 1000, height: 1000 })
    ).toEqual({ scale: 0.5, x: 250, y: 0 });
  });

  it("con un área sin tamaño (aún no medida) devuelve la identidad", () => {
    expect(
      fitView({ width: 0, height: 0 }, { width: 1000, height: 1000 })
    ).toEqual(IDENTITY_VIEW);
  });
});

describe("conversión pantalla ↔ documento", () => {
  const view = fitView(
    { width: 500, height: 1000 },
    { width: 1000, height: 1000 }
  );

  it("el centro del área es el centro del documento", () => {
    expect(screenToDocument({ x: 250, y: 500 }, view)).toEqual({
      x: 500,
      y: 500,
    });
  });

  it("la esquina superior izquierda de la imagen visible es (0, 0)", () => {
    expect(screenToDocument({ x: 0, y: 250 }, view)).toEqual({ x: 0, y: 0 });
  });

  it("ida y vuelta devuelve el mismo punto", () => {
    const view = { x: 37, y: -12, scale: 2.5 };
    const point = { x: 123.4, y: 56.7 };
    const back = screenToDocument(documentToScreen(point, view), view);
    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
  });

  it("documentRectOnScreen da el rectángulo visible del documento", () => {
    expect(documentRectOnScreen({ width: 1000, height: 1000 }, view)).toEqual({
      left: 0,
      top: 250,
      width: 500,
      height: 500,
    });
  });
});
