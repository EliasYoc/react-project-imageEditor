import type { ScreenRect, View } from "../engine/viewport";
import type { Point, Size } from "../model/types";

/**
 * El editor queda a esta fracción del alto libre, contando desde arriba: un
 * poco por encima del centro. Más arriba (con un 20 % pasaba) se sale del
 * lienzo en un documento cuadrado o apaisado y el texto oscuro se escribiría
 * sobre el fondo gris de la pantalla, sin verse.
 */
const EDITOR_TOP_RATIO = 0.4;

/** Aire a cada lado, en píxeles de pantalla, si el texto se encoge para caber. */
const EDITOR_SIDE_MARGIN = 16;

/** Aire entre el editor y el teclado (o el borde de abajo), en píxeles de pantalla. */
const EDITOR_BOTTOM_MARGIN = 8;

/**
 * Franja de la pantalla que se ve, en coordenadas del área del lienzo: sin
 * lo que tapa el teclado del móvil (abajo) ni lo que el navegador haya
 * desplazado fuera de la vista (arriba).
 */
export interface VisibleBand {
  top: number;
  bottom: number;
}

/** Sin teclado: se ve todo. */
export const WHOLE_SCREEN: VisibleBand = { top: -Infinity, bottom: Infinity };

/**
 * Cuánto mide en pantalla cada píxel del editor: el texto se escribe siempre
 * al tamaño de un texto nuevo (`defaultFontSize`, en píxeles del documento),
 * aunque sea más grande o más pequeño o esté escalado; al terminar vuelve a
 * su tamaño. El editor conserva las medidas del texto (tamaño de letra,
 * ancho, márgenes), así que las líneas se cortan igual: solo cambia la escala.
 */
export const textEditingScale = (
  fontSize: number,
  defaultFontSize: number,
  viewScale: number
) => viewScale * (defaultFontSize / fontSize);

/**
 * Dónde se escribe un texto: horizontal (sin el giro del texto), centrado en
 * la zona libre del lienzo y un poco arriba, aunque el texto esté girado o
 * en una esquina. Mientras se escribe el texto del lienzo está oculto; al
 * terminar, sigue donde estaba.
 *
 * `content` es el tamaño del `textarea` sin escalar (todo el texto, aunque no
 * quepa) y `onScreenScale` lo que mide en pantalla cada uno de sus píxeles
 * (`textEditingScale`). Si no cabe a lo ancho de la zona libre, se encoge;
 * nunca se agranda. `scale` es la escala final y `maxHeight`, si no cabe a lo
 * alto, su alto máximo sin escalar (el resto se desplaza dentro del editor);
 * lo demás son las propiedades de CSS.
 */
export const textEditingBox = (
  content: Size,
  onScreenScale: number,
  area: ScreenRect,
  visible: VisibleBand = WHOLE_SCREEN
) => {
  const scale = editingScaleToFit(content.width, onScreenScale, area.width);
  const { top, maxHeight } = editingTop(content.height * scale, area, visible);
  return {
    scale,
    left: area.x + area.width / 2,
    top,
    maxHeight: maxHeight === undefined ? undefined : maxHeight / scale,
    // El origen en el centro de arriba: escalar no lo descentra.
    transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: "50% 0",
  };
};

/** La escala del editor, encogida si no cabe a lo ancho (nunca agrandada). */
const editingScaleToFit = (
  contentWidth: number,
  onScreenScale: number,
  areaWidth: number
) => {
  const availableWidth = areaWidth - 2 * EDITOR_SIDE_MARGIN;
  // Sin zona medida o sin ancho (jsdom, antes de medir): no se encoge.
  return availableWidth > 0 && contentWidth > 0
    ? Math.min(onScreenScale, availableWidth / contentWidth)
    : onScreenScale;
};

/**
 * Dónde empieza el editor (arriba), con `height` su alto en pantalla. Va a un
 * 40 % de la zona libre; si así su parte de abajo quedara tapada (por el
 * teclado del móvil o por el borde de la pantalla), sube lo justo, pero no
 * más arriba de lo que se ve. Si aun así no cabe, devuelve también el alto
 * que tiene sitio (`maxHeight`, en pantalla). Sube solo lo necesario: un
 * texto corto no se mueve al abrirse el teclado.
 */
const editingTop = (height: number, area: ScreenRect, visible: VisibleBand) => {
  const preferredTop = area.y + area.height * EDITOR_TOP_RATIO;
  const lowestBottom =
    Math.min(area.y + area.height, visible.bottom) - EDITOR_BOTTOM_MARGIN;
  const highestTop = Math.max(area.y, visible.top);
  const top = Math.max(
    highestTop,
    Math.min(preferredTop, lowestBottom - height)
  );
  const room = lowestBottom - top;
  return { top, maxHeight: height > room && room > 0 ? room : undefined };
};

/**
 * Dónde queda un texto recién escrito: en el sitio del editor, para que no
 * salte al terminar (un texto que ya existía vuelve a donde estaba). Es la
 * esquina de arriba a la izquierda, en píxeles del documento, y el texto
 * queda centrado donde estaba el editor aunque este se encogiera.
 *
 * `editor` es el `left` (centro) y el `top` de `textEditingBox`, y
 * `contentWidth` el ancho del editor sin escalar.
 */
export const newTextPosition = (
  editor: Pick<ReturnType<typeof textEditingBox>, "left" | "top">,
  contentWidth: number,
  elementScale: number,
  view: View
): Point => ({
  x: (editor.left - view.x) / view.scale - (contentWidth * elementScale) / 2,
  y: (editor.top - view.y) / view.scale,
});
