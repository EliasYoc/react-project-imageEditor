import { describe, expect, it } from "vitest";
import { getMoveableGeometry, measureElement } from "./draggableElements";

describe("getMoveableGeometry", () => {
  it("lee traslación, escala y el rectángulo en pantalla de Moveable", () => {
    const moveable = {
      state: {
        target: { offsetLeft: 5, offsetTop: 6 },
        // matriz 4x4 de CSS: [0]=scaleX, [5]=scaleY, [12]=translateX, [13]=translateY
        targetMatrix: [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 40, 50, 0, 1],
        targetClientRect: { width: 100, height: 60, top: 10, left: 20 },
      },
    };

    expect(getMoveableGeometry(moveable)).toEqual({
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

  it("devuelve null si Moveable no tiene un elemento seleccionado", () => {
    expect(getMoveableGeometry({ state: { target: null } })).toBeNull();
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
