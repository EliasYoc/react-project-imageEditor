import { describe, expect, it } from "vitest";
import {
  IDENTITY_VIEW,
  MAX_ZOOM,
  clampPan,
  documentRectOnScreen,
  documentToScreen,
  fitView,
  panBy,
  pinchView,
  screenToDocument,
  visibleArea,
  zoomAt,
  zoomLimits,
  type View,
} from "./viewport";

describe("visibleArea", () => {
  it("sin nada que tape, es todo el área del lienzo", () => {
    expect(visibleArea({ width: 400, height: 800 })).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 800,
    });
  });

  it("quita lo que tapan los bordes", () => {
    expect(
      visibleArea(
        { width: 400, height: 800 },
        { top: 100, right: 20, bottom: 50, left: 10 }
      )
    ).toEqual({ x: 10, y: 100, width: 370, height: 650 });
  });
});

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

  it("deja libre lo que tapa la cabecera y se centra en el resto", () => {
    // Área 1000 × 600 con 100 px tapados arriba: quedan 1000 × 500.
    expect(
      fitView(
        { width: 1000, height: 600 },
        { width: 1000, height: 1000 },
        { top: 100, right: 0, bottom: 0, left: 0 }
      )
    ).toEqual({ scale: 0.5, x: 250, y: 100 });
  });

  it("los límites de zoom parten del ajuste con lo que tapa la cabecera", () => {
    const limits = zoomLimits(
      { width: 1000, height: 600 },
      { width: 1000, height: 1000 },
      { top: 100, right: 0, bottom: 0, left: 0 }
    );
    expect(limits.min).toBe(0.25);
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

const expectPointClose = (
  actual: { x: number; y: number },
  expected: { x: number; y: number }
) => {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
};

describe("zoom y desplazamiento", () => {
  const stage = { width: 800, height: 600 };
  const doc = { width: 1600, height: 1200 };
  const limits = zoomLimits(stage, doc); // ajuste = 0.5
  const fit = fitView(stage, doc);

  it("límites: de la mitad del ajuste a MAX_ZOOM", () => {
    expect(limits).toEqual({ min: 0.25, max: MAX_ZOOM });
  });

  it("zoomAt mantiene fijo el punto bajo el cursor", () => {
    const cursor = { x: 123, y: 456 };
    const before = screenToDocument(cursor, fit);
    const zoomed = zoomAt(fit, cursor, 3, limits);
    expect(zoomed.scale).toBeCloseTo(1.5);
    expectPointClose(screenToDocument(cursor, zoomed), before);
  });

  it("zoomAt respeta los límites", () => {
    expect(zoomAt(fit, { x: 0, y: 0 }, 1000, limits).scale).toBe(MAX_ZOOM);
    expect(zoomAt(fit, { x: 0, y: 0 }, 0.001, limits).scale).toBe(0.25);
  });

  it("panBy mueve la vista sin cambiar la escala", () => {
    expect(panBy({ x: 10, y: 20, scale: 2 }, 5, -5)).toEqual({
      x: 15,
      y: 15,
      scale: 2,
    });
  });

  it("pinchView: separar los dedos acerca y el punto entre ellos sigue a los dedos", () => {
    const start = { view: fit, mid: { x: 400, y: 300 }, distance: 100 };
    const docUnderFingers = screenToDocument(start.mid, fit);

    const view = pinchView(start, { x: 450, y: 320 }, 200, limits);
    expect(view.scale).toBeCloseTo(1); // distancia ×2 → escala ×2
    expectPointClose(
      screenToDocument({ x: 450, y: 320 }, view),
      docUnderFingers
    );
  });

  it("clampPan no deja que el centro del documento salga del área", () => {
    const lost: View = { x: 5000, y: -5000, scale: 0.5 };
    const clamped = clampPan(lost, stage, doc);
    const center = documentToScreen({ x: 800, y: 600 }, clamped);
    expect(center.x).toBeCloseTo(stage.width);
    expect(center.y).toBeCloseTo(0);
  });
});
