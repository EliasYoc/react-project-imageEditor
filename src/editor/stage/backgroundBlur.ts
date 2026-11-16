import { createCanvas, get2dContext } from "../../lib/canvas";
import { PaintRaster, type PaintRasterOptions } from "../engine/PaintRaster";
import {
  blurLayers,
  revealBlurred,
  type BlurSource,
} from "../engine/brushes/blur";
import { paintBlurMask } from "../engine/brushes/paint";
import type { Size, StrokeEntry } from "../model/types";

/** Un borrador que se está arrastrando: su canvas y la opacidad del trazo. */
export interface LiveEraser {
  canvas: HTMLCanvasElement;
  opacity: number;
}

interface BackgroundBlurOptions {
  /** El fondo tal como se ve ahora: la foto (o blanco) y la capa de color. */
  getBackground: () => BlurSource[];
  /** Búfer de trazo compartido con los otros rasters del lienzo. */
  getScratch?: PaintRasterOptions["getScratch"];
}

/**
 * Desenfoque del FONDO (la foto y la capa de color), que no son trazos y por
 * eso no se pueden desenfocar "en el sitio" como la pintura.
 *
 * Se guarda una máscara (dónde pasó el pincel de desenfoque, menos lo que
 * quitaron los borradores) y una copia desenfocada del fondo. Lo que se
 * muestra (`view`) es esa copia recortada con la máscara, encima del fondo
 * nítido. Al cambiar el fondo solo hay que rehacer la copia: los trazos no
 * se repintan.
 *
 * No crea ningún canvas hasta que hay un trazo de desenfoque.
 */
export const createBackgroundBlur = (
  size: Size,
  { getBackground, getScratch }: BackgroundBlurOptions
) => {
  let mask: PaintRaster | null = null;
  let view: HTMLCanvasElement | null = null;
  let blurred: HTMLCanvasElement | null = null;
  let isBackgroundStale = true;
  let strokeCount = 0;
  let liveEraser: LiveEraser | null = null;

  /** Rehace lo que se muestra: máscara (menos el borrador en curso) × copia. */
  const compose = () => {
    if (!mask || !view || strokeCount === 0) return;
    if (isBackgroundStale || !blurred) {
      blurred = blurLayers(getBackground(), size, { into: blurred });
      isBackgroundStale = false;
    }
    const ctx = get2dContext(view);
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.drawImage(mask.canvas, 0, 0);
    if (liveEraser) {
      ctx.save();
      ctx.globalAlpha = liveEraser.opacity;
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(liveEraser.canvas, 0, 0);
      ctx.restore();
    }
    revealBlurred(ctx, blurred);
  };

  return {
    /** Lo que hay que mostrar sobre el fondo (null si no hay desenfoque). */
    get view() {
      return strokeCount > 0 ? view : null;
    },

    /** Pone al día la máscara con los trazos de su capa (`splitStrokeLayers`). */
    sync(strokes: readonly StrokeEntry[]) {
      strokeCount = strokes.length;
      // Nunca se usó el desenfoque: no se crea nada.
      if (strokeCount === 0 && !mask) return;
      mask ??= new PaintRaster(size, { paint: paintBlurMask, getScratch });
      view ??= createCanvas(size);
      mask.sync(strokes);
      compose();
    },

    /** El fondo cambió (otro color, otro degradado…): se vuelve a desenfocar. */
    invalidateBackground() {
      isBackgroundStale = true;
      compose();
    },

    /**
     * Borrador en curso (null al terminar): mientras se arrastra, lo que
     * lleva borrado se resta de la máscara en cada `refresh`.
     */
    setLiveEraser(eraser: LiveEraser | null) {
      const hadEraser = liveEraser !== null;
      liveEraser = eraser;
      // Al soltarlo sin guardar el trazo (gesto cancelado) vuelve lo borrado.
      if (hadEraser && !eraser) compose();
    },

    /** Hay que llamar a `refresh` cuando cambie el trazo en curso. */
    get needsLiveRefresh() {
      return liveEraser !== null && strokeCount > 0;
    },

    refresh: compose,
  };
};

export type BackgroundBlur = ReturnType<typeof createBackgroundBlur>;
