import type { Size } from "../editor/model/types";
import { fitToMaxSide } from "./helper";

/**
 * Lado mayor de un video, al abrirlo y al exportarlo (Full HD). Un 4K
 * necesitaría unos 200 MB solo en capas al exportar.
 */
const MAX_VIDEO_SIDE = 1920;

/**
 * El tamaño de un video: el pedido, reducido a Full HD si es mayor y con los
 * lados pares (el códec H.264 no admite lados impares).
 */
export const fitVideoSize = (size: Size): Size => {
  const { width, height } =
    Math.max(size.width, size.height) > MAX_VIDEO_SIDE
      ? fitToMaxSide(size, MAX_VIDEO_SIDE)
      : size;
  const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);
  return { width: even(width), height: even(height) };
};
