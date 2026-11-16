import { GRADIENT_PRESETS } from "../../../editor/engine/fill/presets";

/**
 * Los degradados del fondo que sirven para un texto: sin los cónicos (Konva
 * no los pinta en las formas) ni la "Viñeta" (transparente en el centro).
 */
export const TEXT_GRADIENT_PRESETS = GRADIENT_PRESETS.filter(
  ({ id, gradient }) => gradient.type !== "conic" && id !== "vineta"
);

/** El degradado con el que se activa la sección por primera vez. */
export const DEFAULT_TEXT_GRADIENT = TEXT_GRADIENT_PRESETS[0].gradient;
