import { useMemo } from "react";
import { createCanvas } from "../../lib/canvas";
import { PaintRaster } from "../engine/PaintRaster";
import type { Size } from "../model/types";

/**
 * Los canvas donde se pintan los trazos, uno de cada por tamaño de documento:
 * el raster de la pintura, el del resaltador y el del trazo en curso.
 */
export const usePaintRasters = (canvasSize: Size) => {
  // Búfer de trazo (opacidad, fusión, máscaras) compartido por los rasters:
  // se pintan de uno en uno. Se crea al usarse por primera vez.
  const getScratch = useMemo(() => {
    let scratch: HTMLCanvasElement | null = null;
    return () => (scratch ??= createCanvas(canvasSize));
  }, [canvasSize]);
  const raster = useMemo(
    () => new PaintRaster(canvasSize, { getScratch }),
    [canvasSize, getScratch]
  );
  const highlightRaster = useMemo(
    () => new PaintRaster(canvasSize, { getScratch }),
    [canvasSize, getScratch]
  );
  const liveCanvas = useMemo(() => createCanvas(canvasSize), [canvasSize]);
  return { getScratch, raster, highlightRaster, liveCanvas };
};
