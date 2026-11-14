// Tests de caracterización: fijan el comportamiento ACTUAL de la geometría del
// canvas para detectar regresiones al migrar el núcleo a Konva (Fase 2).
import { describe, expect, it } from "vitest";
import {
  getCalculatedCoordsOfContainCanvas,
  getDominantCellSizeOfContainCanvas,
  paintWholeCanvas,
  redrawLastPath,
  transformElementSizeIntoCanvasElementSize,
} from "./canvasUtils";

/** Contexto 2D falso que registra las llamadas en orden. */
const createRecordingCtx = () => {
  const calls = [];
  const record =
    (name) =>
    (...args) =>
      calls.push([name, ...args]);
  return {
    calls,
    beginPath: record("beginPath"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    quadraticCurveTo: record("quadraticCurveTo"),
    stroke: record("stroke"),
    fillRect: record("fillRect"),
    fillStyle: null,
  };
};

describe("getDominantCellSizeOfContainCanvas", () => {
  // Firma real: (anchoMostrado, altoMostrado, altoCanvas, anchoCanvas)
  it("canvas cuadrado dentro de un contenedor vertical: manda el ancho", () => {
    const result = getDominantCellSizeOfContainCanvas(500, 1000, 1000, 1000);
    expect(result.dominantCellSize).toBe(0.5);
    expect(result.width).toBe(500);
    expect(result.height).toBe(500);
  });

  it("canvas cuadrado dentro de un contenedor horizontal: manda el alto", () => {
    const result = getDominantCellSizeOfContainCanvas(1000, 500, 1000, 1000);
    expect(result.dominantCellSize).toBe(0.5);
    expect(result.width).toBe(500);
    expect(result.height).toBe(500);
  });
});

describe("getCalculatedCoordsOfContainCanvas", () => {
  const fakeCanvas = (rectWidth, rectHeight, left = 0, top = 0) => ({
    getBoundingClientRect: () => ({
      left,
      top,
      width: rectWidth,
      height: rectHeight,
    }),
  });

  it("convierte el centro de la pantalla al centro del canvas (object-fit: contain)", () => {
    // Canvas 1000x1000 mostrado en 500x1000: se ve a 500x500 centrado,
    // con 250px vacíos arriba y abajo.
    const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
      canvasElement: fakeCanvas(500, 1000),
      canvasWidthPixel: 1000,
      canvasHeightPixel: 1000,
      xCoord: 250,
      yCoord: 500,
    });
    expect(coordX).toBe(500);
    expect(coordY).toBe(500);
  });

  it("la esquina superior izquierda de la imagen visible es (0, 0)", () => {
    const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
      canvasElement: fakeCanvas(500, 1000),
      canvasWidthPixel: 1000,
      canvasHeightPixel: 1000,
      xCoord: 0,
      yCoord: 250,
    });
    expect(coordX).toBe(0);
    expect(coordY).toBe(0);
  });

  it("descuenta la posición del lienzo en la pantalla (p. ej. debajo del header)", () => {
    // El mismo lienzo, pero empezando 60px más abajo (hay un header encima).
    const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
      canvasElement: fakeCanvas(500, 1000, 0, 60),
      canvasWidthPixel: 1000,
      canvasHeightPixel: 1000,
      xCoord: 250,
      yCoord: 560,
    });
    expect(coordX).toBe(500);
    expect(coordY).toBe(500);
  });
});

describe("transformElementSizeIntoCanvasElementSize", () => {
  it("canvas horizontal: escala según el ancho", () => {
    expect(
      transformElementSizeIntoCanvasElementSize(100, 50, 500, 250, 1000, 500)
    ).toEqual({ newElementWidth: 200, newElementHeight: 100 });
  });

  it("canvas vertical: escala según el alto", () => {
    expect(
      transformElementSizeIntoCanvasElementSize(100, 50, 250, 500, 500, 1000)
    ).toEqual({ newElementWidth: 200, newElementHeight: 100 });
  });
});

describe("paintWholeCanvas", () => {
  it("rellena todo el canvas con el color indicado", () => {
    const ctx = createRecordingCtx();
    paintWholeCanvas(ctx, "red", 300, 200);
    expect(ctx.fillStyle).toBe("red");
    expect(ctx.calls).toEqual([["fillRect", 0, 0, 300, 200]]);
  });
});

describe("redrawLastPath", () => {
  it("no dibuja nada si no hay puntos", () => {
    const ctx = createRecordingCtx();
    redrawLastPath(ctx, []);
    expect(ctx.calls).toEqual([]);
  });

  it("suaviza el trazo con curvas cuadráticas entre puntos medios", () => {
    const ctx = createRecordingCtx();
    redrawLastPath(ctx, [
      { coordX: 0, coordY: 0 },
      { coordX: 10, coordY: 0 },
      { coordX: 20, coordY: 0 },
    ]);
    expect(ctx.calls).toEqual([
      ["beginPath"],
      ["moveTo", 0, 0],
      ["lineTo", 0, 0],
      ["quadraticCurveTo", 0, 0, 5, 0],
      ["quadraticCurveTo", 10, 0, 15, 0],
      ["lineTo", 20, 0],
      ["stroke"],
    ]);
  });
});
