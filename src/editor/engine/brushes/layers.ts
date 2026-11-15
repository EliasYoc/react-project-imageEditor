import type { BrushStroke } from "./brushStroke";
import { strokeBlend } from "./paint";

/** En qué capa(s) se pinta un trazo. */
export interface StrokeLayers {
  /** Capa de pintura: encima de la foto, tapa lo que hay debajo. */
  paint: boolean;
  /** Capa del resaltador: se MULTIPLICA con la foto (la tiñe sin taparla). */
  highlight: boolean;
}

/**
 * Reparte los trazos en dos capas:
 *
 * - el resaltador (modo multiplicar) va en su propia capa, entre el fondo y
 *   la pintura, que se multiplica con la foto como un rotulador de verdad
 *   sobre papel impreso. En la capa de pintura solo se multiplicaría con la
 *   pintura (sobre la foto se vería como un color translúcido);
 * - los borradores van en las dos capas: borran pintura y resaltador;
 * - el resto, en la capa de pintura.
 *
 * Por eso el resaltador queda siempre DEBAJO de la tinta, aunque se pinte
 * después: como al subrayar un texto impreso.
 */
export const strokeLayers = (
  stroke: Pick<BrushStroke, "brush">
): StrokeLayers => {
  switch (strokeBlend(stroke)) {
    case "multiply":
      return { paint: false, highlight: true };
    case "destination-out":
      return { paint: true, highlight: true };
    default:
      return { paint: true, highlight: false };
  }
};

/**
 * Los trazos de cada capa, en orden. Un borrador anterior al primer
 * resaltador no tiene nada que borrar en su capa y se omite: sin resaltador,
 * esa capa no cuesta nada.
 *
 * Cada lista solo crece por el final cuando se añade un trazo (lo anterior no
 * cambia), así que el raster de cada capa se puede poner al día por partes.
 */
export const splitStrokeLayers = <T extends Pick<BrushStroke, "brush">>(
  strokes: readonly T[]
) => {
  const paint: T[] = [];
  const highlight: T[] = [];
  for (const stroke of strokes) {
    const layers = strokeLayers(stroke);
    if (layers.paint) paint.push(stroke);
    const isEraser = layers.paint && layers.highlight;
    if (layers.highlight && (!isEraser || highlight.length > 0)) {
      highlight.push(stroke);
    }
  }
  return { paint, highlight };
};
