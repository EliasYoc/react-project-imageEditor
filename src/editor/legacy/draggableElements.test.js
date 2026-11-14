import { describe, expect, it } from "vitest";
import { getElementGeometry, measureElement } from "./draggableElements";

const fakeElement = (rect) => ({
  offsetLeft: 5,
  offsetTop: 6,
  getBoundingClientRect: () => rect,
});

describe("getElementGeometry", () => {
  it("toma el rectángulo del DOM y la traslación/escala de Moveable", () => {
    const moveable = {
      // matriz 4x4 de CSS: [0]=scaleX, [5]=scaleY, [12]=translateX, [13]=translateY
      state: {
        targetMatrix: [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 40, 50, 0, 1],
      },
    };
    const element = fakeElement({ left: 20, top: 10, width: 100, height: 60 });

    expect(getElementGeometry(element, moveable)).toEqual({
      translate: [40, 50],
      scale: [2, 3],
      offsetLeft: 5,
      offsetTop: 6,
      realWidth: 100,
      realHeight: 60,
      realTop: 10,
      realLeft: 20,
    });
  });

  it("sin Moveable devuelve igualmente el rectángulo (lo que usa la exportación)", () => {
    const element = fakeElement({ left: 1, top: 2, width: 200, height: 120 });
    const geometry = getElementGeometry(element, undefined);
    expect(geometry).toMatchObject({ realWidth: 200, realHeight: 120 });
    expect(geometry).not.toHaveProperty("translate");
  });
});

describe("measureElement", () => {
  it("devuelve la posición en pantalla y el tamaño como medidas iniciales", () => {
    const element = document.createElement("div");
    element.style.width = "120px";
    element.style.height = "40px";
    element.getBoundingClientRect = () => ({ left: 30, top: 70 });
    // jsdom solo calcula estilos de elementos que están en el documento.
    document.body.append(element);

    expect(measureElement(element)).toMatchObject({
      left: 30,
      top: 70,
      realLeft: 30,
      realTop: 70,
      initialWidth: 120,
      realWidth: 120,
      initialHeight: 40,
      realHeight: 40,
    });
  });
});
