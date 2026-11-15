import type { Size } from "../model/types";

/** Rectángulo alineado con los ejes, en píxeles del documento. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapResult {
  /** Desplazamiento a aplicar para quedar alineado (0 si no hay ajuste). */
  dx: number;
  dy: number;
  /** Guías a dibujar: x de las verticales e y de las horizontales. */
  vertical: number[];
  horizontal: number[];
}

/**
 * La línea de `targets` más cercana a alguna de `edges` (bordes y centro del
 * elemento), si está a menos de `threshold`.
 */
const nearest = (
  edges: readonly number[],
  targets: readonly number[],
  threshold: number
) => {
  let best: { delta: number; target: number } | null = null;
  for (const edge of edges) {
    for (const target of targets) {
      const delta = target - edge;
      if (
        Math.abs(delta) <= threshold &&
        (!best || Math.abs(delta) < Math.abs(best.delta))
      ) {
        best = { delta, target };
      }
    }
  }
  return best;
};

/**
 * Ajuste ("snapping") de un elemento a los bordes y al centro del documento.
 * `threshold` va en píxeles del documento (quien llama lo convierte desde
 * píxeles de pantalla, para que el imán se sienta igual con cualquier zoom).
 */
export const snapToDocument = (
  box: Box,
  doc: Size,
  threshold: number
): SnapResult => {
  const x = nearest(
    [box.x, box.x + box.width / 2, box.x + box.width],
    [0, doc.width / 2, doc.width],
    threshold
  );
  const y = nearest(
    [box.y, box.y + box.height / 2, box.y + box.height],
    [0, doc.height / 2, doc.height],
    threshold
  );
  return {
    dx: x?.delta ?? 0,
    dy: y?.delta ?? 0,
    vertical: x ? [x.target] : [],
    horizontal: y ? [y.target] : [],
  };
};
