import type { BrushStroke } from "./brushStroke";
import { brushEffect, getBrushPreset } from "./presets";

// Solo los datos del preset, sin importar el motor de pintado (`paint.ts`):
// este reparto lo usa el store, que se carga con la pantalla de inicio, y el
// motor (con el desenfoque de Konva) solo hace falta al abrir el editor.
const strokeBlend = (stroke: Pick<BrushStroke, "brush">) =>
  getBrushPreset(stroke.brush).blend;
const strokeEffect = (stroke: Pick<BrushStroke, "brush">) =>
  brushEffect(stroke.brush);

/** En qué capa(s) se pinta un trazo. */
export interface StrokeLayers {
  /** Capa de pintura: encima de la foto, tapa lo que hay debajo. */
  isInPaintLayer: boolean;
  /** Capa del resaltador: se MULTIPLICA con la foto (la tiñe sin taparla). */
  isInHighlightLayer: boolean;
  /** Máscara del desenfoque del fondo: dónde se ve la foto desenfocada. */
  isInBlurLayer: boolean;
}

/**
 * Reparte los trazos en capas:
 *
 * - el resaltador (modo multiplicar) va en su propia capa, entre el fondo y
 *   la pintura, que se multiplica con la foto como un rotulador de verdad
 *   sobre papel impreso. En la capa de pintura solo se multiplicaría con la
 *   pintura (sobre la foto se vería como un color translúcido);
 * - el desenfoque va en todas: desenfoca lo que hay pintado en la capa de
 *   pintura y en la del resaltador y, en la máscara del fondo, marca dónde
 *   se ve la foto desenfocada;
 * - los borradores van también en todas: borran pintura y resaltador, y
 *   quitan el desenfoque del fondo;
 * - el resto, en la capa de pintura.
 *
 * Por eso el resaltador queda siempre DEBAJO de la tinta, aunque se pinte
 * después: como al subrayar un texto impreso.
 */
export const strokeLayers = (
  stroke: Pick<BrushStroke, "brush">
): StrokeLayers => {
  if (strokeEffect(stroke) === "blur") {
    return {
      isInPaintLayer: true,
      isInHighlightLayer: true,
      isInBlurLayer: true,
    };
  }
  switch (strokeBlend(stroke)) {
    case "multiply":
      return {
        isInPaintLayer: false,
        isInHighlightLayer: true,
        isInBlurLayer: false,
      };
    case "destination-out":
      return {
        isInPaintLayer: true,
        isInHighlightLayer: true,
        isInBlurLayer: true,
      };
    default:
      return {
        isInPaintLayer: true,
        isInHighlightLayer: false,
        isInBlurLayer: false,
      };
  }
};

/**
 * Los trazos de cada capa, en orden. Un trazo que no tiene nada que hacer en
 * una capa se omite, y así una capa que no se usa no cuesta nada:
 *
 * - un borrador anterior al primer resaltador no entra en su capa, ni en la
 *   máscara del desenfoque uno anterior al primer desenfoque;
 * - un desenfoque no entra en la capa de pintura si aún no hay nada pintado,
 *   ni en la del resaltador si no hay nada resaltado.
 *
 * Que un trazo entre o no en una capa depende solo de los anteriores: cada
 * lista solo crece por el final cuando se añade un trazo, así que el raster
 * de cada capa se puede poner al día por partes.
 */
export const splitStrokeLayers = <T extends Pick<BrushStroke, "brush">>(
  strokes: readonly T[]
) => {
  const paint: T[] = [];
  const highlight: T[] = [];
  const blur: T[] = [];
  /** Ya hay pintura (no solo borradores) en la capa de pintura. */
  let hasPaint = false;
  for (const stroke of strokes) {
    const layers = strokeLayers(stroke);
    const isBlur = strokeEffect(stroke) === "blur";
    const isEraser =
      !isBlur && layers.isInPaintLayer && layers.isInHighlightLayer;

    if (layers.isInPaintLayer && (!isBlur || hasPaint)) paint.push(stroke);
    if (
      layers.isInHighlightLayer &&
      (highlight.length > 0 || !(isBlur || isEraser))
    ) {
      highlight.push(stroke);
    }
    if (layers.isInBlurLayer && (blur.length > 0 || isBlur)) blur.push(stroke);
    if (layers.isInPaintLayer && !isBlur && !isEraser) hasPaint = true;
  }
  return { paint, highlight, blur };
};
