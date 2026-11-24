import { documentToScreen, type View } from "../engine/viewport";
import { normalizeDegrees } from "./angles";
import type { ElementTransform } from "./nodeConfig";

/**
 * Cómo se ve en pantalla la caja de un texto: dónde queda su esquina de
 * arriba a la izquierda (en coordenadas del área del lienzo), su giro en
 * grados y su escala.
 *
 * El editor y el nodo de Konva tienen la misma caja sin escalar (mismo
 * tamaño de letra, márgenes y ancho): con dos poses se puede llevar uno al
 * sitio del otro.
 */
export interface ScreenPose {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

/** Dónde está el editor: `left` es su centro y `top` su borde de arriba. */
interface EditorPlacement {
  left: number;
  top: number;
  scale: number;
}

/** Pose del texto en el lienzo (su nodo de Konva). */
export const elementPose = (
  { x, y, rotation, scale }: Omit<ElementTransform, "id">,
  view: View
): ScreenPose => ({
  ...documentToScreen({ x, y }, view),
  rotation: normalizeDegrees(rotation),
  scale: scale * view.scale,
});

/**
 * Pose del editor colocado por `textEditingBox` (centrado en `left`, sin
 * girar), con `contentWidth` su ancho sin escalar.
 */
export const editorPose = (
  { left, top, scale }: EditorPlacement,
  contentWidth: number
): ScreenPose => ({
  x: left - (contentWidth * scale) / 2,
  y: top,
  rotation: 0,
  scale,
});

/**
 * Transformación de CSS (con `transform-origin: 0 0`) que lleva el editor,
 * cuya esquina sin transformar está en `left` y `top`, a `pose`. Para
 * animarlo entre su sitio y el del texto en el lienzo: todas tienen las
 * mismas funciones, así que el navegador interpola cada una por separado.
 */
export const transformToPose = (
  pose: ScreenPose,
  { left, top }: Pick<EditorPlacement, "left" | "top">
) =>
  `translate(${pose.x - left}px, ${pose.y - top}px) ` +
  `rotate(${pose.rotation}deg) scale(${pose.scale})`;
