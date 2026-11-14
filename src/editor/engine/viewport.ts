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

// ---------------------------------------------------------------- zoom

/** Zoom máximo: 1 píxel del documento = 16 píxeles de pantalla. */
export const MAX_ZOOM = 16;

export interface ZoomLimits {
  min: number;
  max: number;
}

/** Se puede alejar hasta la mitad del ajuste y acercar hasta MAX_ZOOM. */
export const zoomLimits = (stage: Size, doc: Size): ZoomLimits => {
  const fit = fitView(stage, doc).scale;
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

/**
 * Transform CSS para la capa HTML de textos e imágenes (legacy, hasta la
 * Fase 4). Sus posiciones están en píxeles de pantalla de la vista ajustada:
 * esta transformación las lleva a la vista actual.
 */
export const overlayTransform = (view: View, fit: View) => {
  const k = view.scale / fit.scale;
  return {
    x: view.x - fit.x * k,
    y: view.y - fit.y * k,
    scale: k,
  };
};
