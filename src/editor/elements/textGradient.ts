import type { CSSProperties } from "react";
import type { Text as KonvaText } from "konva/lib/shapes/Text";
import { gradientToCss } from "../engine/fill/css";
import { linearGradientLine } from "../engine/fill/geometry";
import { sortStops } from "../engine/fill/stops";
import { rgbaToCss } from "../model/color";
import type { Gradient, Point, Size, TextStyle } from "../model/types";

/** Caja donde se reparte el degradado: la del texto, sin el margen interior. */
export interface TextBox extends Point, Size {}

/** Con color sólido, Konva usa `fill` aunque queden atributos de degradado. */
export const SOLID_TEXT_FILL = { fillPriority: "color" } as const;

/**
 * El texto solo admite lineal y radial: Konva no tiene degradado cónico para
 * las formas (un cónico que llegue aquí se pinta como radial).
 */
const isLinear = (gradient: Gradient) => gradient.type === "linear";

/**
 * Atributos de Konva para rellenar un texto con un degradado, en las
 * coordenadas del nodo:
 *
 * - lineal: la línea de CSS (`linear-gradient(<ángulo>, …)`) en la caja;
 * - radial: un CÍRCULO hasta la esquina más lejana (`circle farthest-corner`).
 *   Konva no puede deformar el degradado en elipse; en un texto, que suele ser
 *   ancho y bajo, el círculo además reparte mejor los colores.
 *
 * El degradado abarca todo el bloque (todas las líneas), como
 * `background-clip: text` en CSS.
 */
export const textGradientAttrs = (gradient: Gradient, box: TextBox) => {
  const colorStops = sortStops(gradient.stops).flatMap((stop) => [
    Math.min(1, Math.max(0, stop.offset)),
    rgbaToCss(stop.color),
  ]);

  if (isLinear(gradient)) {
    const { x0, y0, x1, y1 } = linearGradientLine(gradient.angle, box);
    return {
      fillPriority: "linear-gradient",
      fillLinearGradientStartPoint: { x: box.x + x0, y: box.y + y0 },
      fillLinearGradientEndPoint: { x: box.x + x1, y: box.y + y1 },
      fillLinearGradientColorStops: colorStops,
    } as const;
  }

  const cx = gradient.center.x * box.width;
  const cy = gradient.center.y * box.height;
  const center = { x: box.x + cx, y: box.y + cy };
  return {
    fillPriority: "radial-gradient",
    fillRadialGradientStartPoint: center,
    fillRadialGradientEndPoint: center,
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: Math.hypot(
      Math.max(cx, box.width - cx),
      Math.max(cy, box.height - cy)
    ),
    fillRadialGradientColorStops: colorStops,
  } as const;
};

export const textFillAttrs = (gradient: Gradient | null, box: TextBox) =>
  gradient ? textGradientAttrs(gradient, box) : SOLID_TEXT_FILL;

/**
 * Aplica el relleno a un nodo Text ya medido. El degradado depende del tamaño
 * del texto, que Konva solo conoce después de crear el nodo; por eso se
 * aplica aparte (en el lienzo, al renderizar y al cambiar el ancho; en la
 * exportación, al crear el nodo).
 */
export const applyTextFill = (text: KonvaText, gradient: Gradient | null) => {
  const padding = text.padding();
  text.setAttrs(
    textFillAttrs(gradient, {
      x: padding,
      y: padding,
      width: Math.max(1, text.width() - padding * 2),
      height: Math.max(1, text.height() - padding * 2),
    })
  );
};

/** El mismo degradado en CSS, para el editor de texto y las vistas previas. */
export const textGradientCss = (gradient: Gradient) =>
  isLinear(gradient)
    ? gradientToCss(gradient)
    : gradientToCss({ ...gradient, type: "radial" }, "circle");

/**
 * Relleno del textarea mientras se escribe: el degradado recortado a las
 * letras (`background-clip: text`) y, debajo, la caja de fondo si la hay.
 */
export const textEditorPaint = ({
  color,
  gradient,
  background,
}: Pick<TextStyle, "color" | "gradient" | "background">): CSSProperties => {
  const box = background.isEnabled ? rgbaToCss(background.color) : null;
  if (!gradient) {
    return { color: rgbaToCss(color), ...(box && { background: box }) };
  }
  const layers = [textGradientCss(gradient)];
  if (box) layers.push(`linear-gradient(${box}, ${box})`);
  return {
    color: "transparent",
    backgroundImage: layers.join(", "),
    backgroundOrigin: box ? "content-box, border-box" : "content-box",
    backgroundClip: box ? "text, border-box" : "text",
    WebkitBackgroundClip: box ? "text, border-box" : "text",
  };
};
