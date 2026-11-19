import type { Size } from "../../../editor/model/types";

/** Lado mayor del lienzo "Pantalla". */
const MAX_SCREEN_SIDE = 2048;

/** La proporción de la pantalla, en píxeles reales, hasta 2048 px. */
export const screenCanvasSize = (): Size => {
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth * ratio;
  const height = window.innerHeight * ratio;
  const scale = Math.min(1, MAX_SCREEN_SIDE / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};
