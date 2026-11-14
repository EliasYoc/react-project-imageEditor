import type { Point, Size } from "../model/types";

/**
 * Cómo se ve el documento en pantalla:
 *
 *   pantalla = documento × scale + (x, y)
 *
 * Las coordenadas de pantalla son relativas a la esquina superior izquierda
 * del área del lienzo (no de la ventana).
 */
export interface View {
  x: number;
  y: number;
  scale: number;
}

export const IDENTITY_VIEW: View = { x: 0, y: 0, scale: 1 };

/**
 * Vista que muestra el documento completo y centrado (como `object-fit:
 * contain`). Antes este cálculo se repetía a mano en cada conversión de
 * coordenadas (`getCalculatedCoordsOfContainCanvas`).
 */
export const fitView = (stage: Size, doc: Size): View => {
  if (!stage.width || !stage.height || !doc.width || !doc.height) {
    return IDENTITY_VIEW;
  }
  const scale = Math.min(stage.width / doc.width, stage.height / doc.height);
  return {
    scale,
    x: (stage.width - doc.width * scale) / 2,
    y: (stage.height - doc.height * scale) / 2,
  };
};

export const screenToDocument = (point: Point, view: View): Point => ({
  x: (point.x - view.x) / view.scale,
  y: (point.y - view.y) / view.scale,
});

export const documentToScreen = (point: Point, view: View): Point => ({
  x: point.x * view.scale + view.x,
  y: point.y * view.scale + view.y,
});

/** Rectángulo que ocupa el documento en pantalla. */
export const documentRectOnScreen = (doc: Size, view: View) => ({
  left: view.x,
  top: view.y,
  width: doc.width * view.scale,
  height: doc.height * view.scale,
});
