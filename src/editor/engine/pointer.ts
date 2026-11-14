import type { Point, StrokePoint } from "../model/types";
import { screenToDocument, type View } from "./viewport";

export type PointerSample = Pick<
  PointerEvent,
  "clientX" | "clientY" | "pressure" | "pointerType"
>;

/**
 * Todos los puntos que trae un `pointermove`.
 *
 * El navegador agrupa los movimientos que ocurren entre dos frames y solo
 * envía uno; `getCoalescedEvents()` devuelve los intermedios. Con un lápiz
 * (120–240 Hz) son muchos más puntos y el trazo sale más fiel. No existe en
 * todos los navegadores ni fuera de HTTPS: entonces se usa el propio evento.
 */
export const getPointerSamples = (event: PointerEvent): PointerSample[] => {
  const coalesced = event.getCoalescedEvents?.();
  return coalesced?.length ? coalesced : [event];
};

/**
 * Presión de 0 a 1. El ratón no tiene presión (reporta 0.5 mientras el botón
 * está apretado) y algunos dispositivos táctiles reportan 0: en ambos casos se
 * usa 0.5 para que los pinceles con presión (Fase 3) se vean normales.
 */
export const normalizePressure = ({
  pointerType,
  pressure,
}: Pick<PointerEvent, "pointerType" | "pressure">) =>
  pointerType === "mouse" || !(pressure > 0) ? 0.5 : pressure;

/** Punto del puntero relativo a la esquina del área del lienzo. */
export const getLocalPoint = (
  { clientX, clientY }: Pick<PointerEvent, "clientX" | "clientY">,
  rect: Pick<DOMRect, "left" | "top">
): Point => ({ x: clientX - rect.left, y: clientY - rect.top });

/** Muestra del puntero → punto del trazo en coordenadas del documento. */
export const toStrokePoint = (
  sample: PointerSample,
  rect: Pick<DOMRect, "left" | "top">,
  view: View
): StrokePoint => ({
  ...screenToDocument(getLocalPoint(sample, rect), view),
  pressure: normalizePressure(sample),
});
