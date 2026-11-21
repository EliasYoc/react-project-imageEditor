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
 * Bordes del área del lienzo tapados por algo opaco (p. ej. la cabecera, que
 * flota encima): al ajustar, el documento los deja libres.
 */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Un rectángulo en píxeles de pantalla (relativos al área del lienzo). */
export interface ScreenRect extends Point, Size {}

/** Lo que queda del área del lienzo sin lo que tapan los `insets`. */
export const visibleArea = (
  stage: Size,
  insets: Insets = NO_INSETS
): ScreenRect => ({
  x: insets.left,
  y: insets.top,
  width: stage.width - insets.left - insets.right,
  height: stage.height - insets.top - insets.bottom,
});

/**
 * Vista que muestra el documento completo y centrado (como `object-fit:
 * contain`) en el área del lienzo menos `insets`. Antes este cálculo se
 * repetía a mano en cada conversión de coordenadas
 * (`getCalculatedCoordsOfContainCanvas`).
 */
export const fitView = (
  stage: Size,
  doc: Size,
  insets: Insets = NO_INSETS
): View => {
  const area = visibleArea(stage, insets);
  if (area.width <= 0 || area.height <= 0 || !doc.width || !doc.height) {
    return IDENTITY_VIEW;
  }
  const scale = Math.min(area.width / doc.width, area.height / doc.height);
  return {
    scale,
    x: area.x + (area.width - doc.width * scale) / 2,
    y: area.y + (area.height - doc.height * scale) / 2,
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

// ---------------------------------------------------------------- zoom

/** Zoom máximo: 1 píxel del documento = 16 píxeles de pantalla. */
export const MAX_ZOOM = 16;

export interface ZoomLimits {
  min: number;
  max: number;
}

/** Se puede alejar hasta la mitad del ajuste y acercar hasta MAX_ZOOM. */
export const zoomLimits = (
  stage: Size,
  doc: Size,
  insets: Insets = NO_INSETS
): ZoomLimits => {
  const fit = fitView(stage, doc, insets).scale;
  return { min: fit / 2, max: Math.max(MAX_ZOOM, fit) };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Vista con escala `scale` en la que el punto `doc` queda en `screen`. */
export const viewWithPointAt = (
  doc: Point,
  screen: Point,
  scale: number
): View => ({
  scale,
  x: screen.x - doc.x * scale,
  y: screen.y - doc.y * scale,
});

/**
 * Acerca o aleja (`factor` > 1 acerca) manteniendo fijo el punto de la
 * pantalla `screen`: lo que hay bajo el cursor o entre los dedos no se mueve.
 */
export const zoomAt = (
  view: View,
  screen: Point,
  factor: number,
  limits: ZoomLimits
): View =>
  viewWithPointAt(
    screenToDocument(screen, view),
    screen,
    clamp(view.scale * factor, limits.min, limits.max)
  );

export const panBy = (view: View, dx: number, dy: number): View => ({
  ...view,
  x: view.x + dx,
  y: view.y + dy,
});

/**
 * Pellizco con dos dedos: zoom según cuánto cambió la distancia entre ellos y
 * desplazamiento según cuánto se movió su punto medio. Se calcula siempre
 * desde la vista del inicio del gesto (no acumula errores frame a frame).
 */
export const pinchView = (
  start: { view: View; mid: Point; distance: number },
  mid: Point,
  distance: number,
  limits: ZoomLimits
): View =>
  viewWithPointAt(
    screenToDocument(start.mid, start.view),
    mid,
    clamp(
      start.view.scale * (distance / start.distance),
      limits.min,
      limits.max
    )
  );

/** Evita perder el documento: su centro no puede salir del área del lienzo. */
export const clampPan = (view: View, stage: Size, doc: Size): View => {
  const halfWidth = (doc.width * view.scale) / 2;
  const halfHeight = (doc.height * view.scale) / 2;
  return {
    ...view,
    x: clamp(view.x, -halfWidth, stage.width - halfWidth),
    y: clamp(view.y, -halfHeight, stage.height - halfHeight),
  };
};
