import { rgbaToCss } from "../../model/color";
import type { ColorStop, Fill, Gradient, Size } from "../../model/types";
import {
  conicStartAngle,
  linearGradientLine,
  radialGradientEllipse,
} from "./geometry";
import { sortStops } from "./stops";

/** El navegador sabe hacer degradados cónicos (Chrome 99, Safari 16.1, Firefox 112). */
export const supportsConicGradient = () =>
  typeof CanvasRenderingContext2D !== "undefined" &&
  "createConicGradient" in CanvasRenderingContext2D.prototype;

const addStops = (gradient: CanvasGradient, stops: readonly ColorStop[]) => {
  for (const stop of sortStops(stops)) {
    gradient.addColorStop(
      Math.min(1, Math.max(0, stop.offset)),
      rgbaToCss(stop.color)
    );
  }
};

const paintRadial = (
  ctx: CanvasRenderingContext2D,
  gradient: Gradient,
  size: Size
) => {
  const { cx, cy, rx, ry } = radialGradientEllipse(gradient.center, size);
  // Elipse: se dibuja un círculo de radio rx en un espacio escalado en y.
  const squash = rx > 0 ? ry / rx : 1;
  ctx.translate(cx, cy);
  ctx.scale(1, squash);
  const fill = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  addStops(fill, gradient.stops);
  ctx.fillStyle = fill;
  ctx.fillRect(-cx, -cy / squash, size.width, size.height / squash);
};

/**
 * Pinta una capa de color o degradado que ocupa `size` (en las unidades del
 * contexto). La geometría es la de CSS y no depende de la resolución: el
 * lienzo y la exportación a la resolución de la foto se ven igual.
 */
export const paintFill = (
  ctx: CanvasRenderingContext2D,
  fill: Fill,
  size: Size
) => {
  ctx.save();
  if (fill.kind === "color") {
    ctx.fillStyle = rgbaToCss(fill.color);
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.restore();
    return;
  }

  const { gradient } = fill;
  if (gradient.type === "linear") {
    const { x0, y0, x1, y1 } = linearGradientLine(gradient.angle, size);
    const linear = ctx.createLinearGradient(x0, y0, x1, y1);
    addStops(linear, gradient.stops);
    ctx.fillStyle = linear;
    ctx.fillRect(0, 0, size.width, size.height);
  } else if (gradient.type === "conic" && supportsConicGradient()) {
    const conic = ctx.createConicGradient(
      conicStartAngle(gradient.angle),
      gradient.center.x * size.width,
      gradient.center.y * size.height
    );
    addStops(conic, gradient.stops);
    ctx.fillStyle = conic;
    ctx.fillRect(0, 0, size.width, size.height);
  } else {
    // Radial (y cónico en navegadores antiguos, como aproximación).
    paintRadial(ctx, gradient, size);
  }
  ctx.restore();
};
