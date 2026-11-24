import type { Node as KonvaNode } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import {
  transformByPinch,
  type Fingers,
  type PinchableTransform,
} from "../elements/pinchTransform";
import { screenToDocument, type View } from "../engine/viewport";
import type { Point } from "../model/types";
import { editorStore } from "../store/editorStore";

/**
 * Margen (en píxeles de pantalla) alrededor del elemento en el que un dedo
 * aún cuenta como "sobre él": un texto pequeño es difícil de acertar.
 */
const HIT_SLOP = 16;

/** Un pellizco en curso sobre un elemento. */
export interface ElementPinch {
  /** Los dedos se movieron (en coordenadas del área del lienzo). */
  update: (a: Point, b: Point) => void;
  /** Se soltó un dedo: el cambio se guarda como un paso del historial. */
  finish: () => void;
  /** El sistema interrumpió el gesto: el elemento vuelve a como estaba. */
  cancel: () => void;
}

const readTransform = (node: KonvaNode): PinchableTransform => ({
  x: node.x(),
  y: node.y(),
  rotation: node.rotation(),
  scale: node.scaleY(),
});

const isNear = (point: Point, node: KonvaNode) => {
  const box = node.getClientRect();
  return (
    point.x >= box.x - HIT_SLOP &&
    point.x <= box.x + box.width + HIT_SLOP &&
    point.y >= box.y - HIT_SLOP &&
    point.y <= box.y + box.height + HIT_SLOP
  );
};

/** Un dedo apoyado: su id de Pointer Events y dónde está en el área del lienzo. */
export interface Touch {
  id: number;
  point: Point;
}

/**
 * Empieza a pellizcar el elemento `elementId` si alguno de los dedos (o su
 * punto medio) está sobre él; si no, devuelve null y el pellizco es zoom.
 *
 * Mientras dura, el nodo de Konva se cambia directamente (sin renders de
 * React, como un arrastre); el store solo se toca al terminar.
 */
export const startElementPinch = (
  stage: KonvaStage,
  elementId: string,
  view: View,
  touches: [Touch, Touch]
): ElementPinch | null => {
  const node = stage.findOne(
    (candidate: KonvaNode) => candidate.id() === elementId
  );
  // Un texto que se está escribiendo está oculto (lo tapa el editor).
  if (!node?.isVisible()) return null;
  const [a, b] = touches.map((touch) => touch.point);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if (![a, b, mid].some((point) => isNear(point, node))) return null;

  // Los dedos ya no son un toque ni un arrastre: al soltarlos, Konva no debe
  // abrir la edición del texto (tap) ni mover el elemento con uno de ellos.
  // Konva hace lo mismo con `_cancelClick` cuando empieza un arrastre.
  for (const touch of touches) stage._cancelClick(touch.id);
  const wasDraggable = node.draggable();
  node.draggable(false);

  const toDocument = (p: Point, q: Point): Fingers => [
    screenToDocument(p, view),
    screenToDocument(q, view),
  ];
  const startFingers = toDocument(a, b);
  const start = readTransform(node);

  const apply = (transform: PinchableTransform) => {
    node.setAttrs({
      x: transform.x,
      y: transform.y,
      rotation: transform.rotation,
      scaleX: transform.scale,
      scaleY: transform.scale,
    });
    // El marco de selección sigue al nodo solo, pero está en otra capa.
    node.getLayer()?.batchDraw();
    for (const transformer of stage.find("Transformer")) {
      transformer.getLayer()?.batchDraw();
    }
  };

  return {
    update: (p, q) =>
      apply(transformByPinch(start, startFingers, toDocument(p, q))),
    finish: () => {
      node.draggable(wasDraggable);
      const end = readTransform(node);
      // Un toque con dos dedos sin moverlos no deja un paso vacío.
      const hasChanged = (
        Object.keys(end) as (keyof PinchableTransform)[]
      ).some((key) => end[key] !== start[key]);
      if (hasChanged) editorStore.getState().editElement(elementId, end);
    },
    cancel: () => {
      node.draggable(wasDraggable);
      apply(start);
    },
  };
};
