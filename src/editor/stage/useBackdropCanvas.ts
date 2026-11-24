import type { Layer as KonvaLayer } from "konva/lib/Layer";
import { useEffect, useMemo, type RefObject } from "react";
import { createCanvas, get2dContext } from "../../lib/canvas";
import { paintFill } from "../engine/fill/paintFill";
import type { Fill, Size } from "../model/types";

/**
 * La capa de color o degradado: un canvas por tamaño de documento que se
 * repinta al cambiar (no se crea uno nuevo en cada movimiento de un control).
 * Al repintarlo se pide un frame a la capa de fondo de Konva, que lo muestra.
 */
export const useBackdropCanvas = (
  canvasSize: Size,
  fill: Fill | null,
  backgroundLayerRef: RefObject<KonvaLayer | null>
) => {
  const fillCanvas = useMemo(() => createCanvas(canvasSize), [canvasSize]);

  useEffect(
    function paintBackdrop() {
      const ctx = get2dContext(fillCanvas);
      ctx.clearRect(0, 0, fillCanvas.width, fillCanvas.height);
      if (fill) paintFill(ctx, fill, canvasSize);
      backgroundLayerRef.current?.batchDraw();
    },
    [fillCanvas, fill, canvasSize, backgroundLayerRef]
  );

  return fillCanvas;
};
