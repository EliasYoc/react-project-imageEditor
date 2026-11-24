import type { Point } from "../model/types";
import type { ElementTransform } from "./nodeConfig";

/**
 * Límites de la escala de un elemento al pellizcarlo. Las asas del marco ya
 * impiden que quede más pequeño que unos píxeles; con los dedos, sin un
 * mínimo, un elemento podría encogerse hasta no poder tocarse más.
 */
export const MIN_PINCH_SCALE = 0.05;
export const MAX_PINCH_SCALE = 50;

/** Posición, giro y escala de un elemento (sin su id). */
export type PinchableTransform = Omit<ElementTransform, "id">;

/** Los dos dedos, en coordenadas del documento. */
export type Fingers = [Point, Point];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Lleva un ángulo en grados al intervalo (-180, 180]. */
const normalizeDegrees = (degrees: number) => {
  const turned = ((degrees % 360) + 360) % 360;
  return turned > 180 ? turned - 360 : turned;
};

/**
 * Transformación de un elemento mientras se pellizca: los dos dedos lo
 * mueven, lo escalan y lo giran como si estuviera pegado a ellos.
 *
 * Es una semejanza (desplazar + girar + escalar) que lleva los dedos de su
 * posición inicial a la actual. Aplicada a la posición del nodo, funciona
 * sea cual sea su punto de giro (el `offset` de Konva), porque se compone por
 * fuera de la transformación del nodo.
 */
export const transformByPinch = (
  start: PinchableTransform,
  startFingers: Fingers,
  fingers: Fingers
): PinchableTransform => {
  const [a0, b0] = startFingers;
  const [a1, b1] = fingers;
  const startSpread = Math.max(1, Math.hypot(b0.x - a0.x, b0.y - a0.y));
  const spread = Math.hypot(b1.x - a1.x, b1.y - a1.y);

  const scale = clamp(
    start.scale * (spread / startSpread),
    MIN_PINCH_SCALE,
    MAX_PINCH_SCALE
  );
  // Con la escala en su límite, la posición se calcula con la escala real.
  const ratio = scale / start.scale;
  const turn =
    Math.atan2(b1.y - a1.y, b1.x - a1.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x);

  const startMid = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
  const mid = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
  const dx = start.x - startMid.x;
  const dy = start.y - startMid.y;
  const cos = Math.cos(turn) * ratio;
  const sin = Math.sin(turn) * ratio;

  return {
    x: mid.x + dx * cos - dy * sin,
    y: mid.y + dx * sin + dy * cos,
    rotation: normalizeDegrees(start.rotation + (turn * 180) / Math.PI),
    scale,
  };
};
