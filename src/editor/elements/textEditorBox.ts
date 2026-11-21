import type { ScreenRect } from "../engine/viewport";

/**
 * El editor queda a esta fracción del alto libre, contando desde arriba: un
 * poco por encima del centro. Más arriba (con un 20 % pasaba) se sale del
 * lienzo en un documento cuadrado o apaisado y el texto oscuro se escribiría
 * sobre el fondo gris de la pantalla, sin verse.
 */
const EDITOR_TOP_RATIO = 0.4;

/** Aire a cada lado, en píxeles de pantalla, si el texto se encoge para caber. */
const EDITOR_SIDE_MARGIN = 16;

/**
 * Dónde se escribe un texto: horizontal (sin el giro del texto), centrado en
 * la zona libre del lienzo y un poco arriba, aunque el texto esté girado o
 * en una esquina. En el móvil, así queda por encima del teclado y se lee
 * bien. Mientras se escribe el texto del lienzo está oculto; al terminar,
 * sigue donde estaba.
 *
 * `contentWidth` es el ancho del `textarea` sin escalar y `onScreenScale` lo
 * que mide en pantalla cada uno de sus píxeles (vista × elemento). Si no cabe
 * a lo ancho de la zona libre, se encoge; nunca se agranda. `scale` es la
 * escala final: el resto son las propiedades de CSS.
 */
export const textEditingBox = (
  contentWidth: number,
  onScreenScale: number,
  area: ScreenRect
) => {
  const availableWidth = area.width - 2 * EDITOR_SIDE_MARGIN;
  // Sin zona medida o sin ancho (jsdom, antes de medir): no se encoge.
  const scale =
    availableWidth > 0 && contentWidth > 0
      ? Math.min(onScreenScale, availableWidth / contentWidth)
      : onScreenScale;
  return {
    scale,
    left: area.x + area.width / 2,
    top: area.y + area.height * EDITOR_TOP_RATIO,
    // El origen en el centro de arriba: escalar no lo descentra.
    transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: "50% 0",
  };
};
