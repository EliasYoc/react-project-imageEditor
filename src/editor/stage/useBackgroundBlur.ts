import type { Layer as KonvaLayer } from "konva/lib/Layer";
import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import type { PaintRaster } from "../engine/PaintRaster";
import { blurLayers, type BlurSource } from "../engine/brushes/blur";
import type { Backdrop, Size } from "../model/types";
import { editorStore } from "../store/editorStore";
import {
  selectBackgroundImage,
  selectStrokeLayers,
  selectVideo,
} from "../store/selectors";
import { createBackgroundBlur } from "./backgroundBlur";
import type { LiveBlur } from "./strokeSession";

interface BackgroundBlurOptions {
  canvasSize: Size;
  /** Los rasters de los trazos (`usePaintRasters`). */
  getScratch: () => HTMLCanvasElement;
  raster: PaintRaster;
  highlightRaster: PaintRaster;
  /** La capa de color o degradado (`useBackdropCanvas`). */
  fillCanvas: HTMLCanvasElement;
  backgroundLayerRef: RefObject<KonvaLayer | null>;
  /** Lo que pinta la capa de fondo: al cambiar, se vuelve a desenfocar. */
  background: CanvasImageSource | null;
  backdrop: Backdrop;
}

/**
 * El pincel de desenfoque sobre el fondo (`createBackgroundBlur`): lo que hay
 * que mostrar encima del fondo nítido, en el nodo `blurNodeRef`, y la copia
 * desenfocada de todo lo que se ve que usa el trazo en curso (`liveBlur`).
 */
export const useBackgroundBlur = ({
  canvasSize,
  getScratch,
  raster,
  highlightRaster,
  fillCanvas,
  backgroundLayerRef,
  background,
  backdrop,
}: BackgroundBlurOptions) => {
  const blurNodeRef = useRef<KonvaImageNode>(null);
  const blurSnapshotRef = useRef<HTMLCanvasElement | null>(null);

  // El fondo tal como se ve (lo mismo que pinta la capa de fondo): es lo que
  // desenfoca el pincel de desenfoque.
  const getBackground = useCallback((): BlurSource[] => {
    const state = editorStore.getState();
    const { backdrop } = state;
    const image = selectBackgroundImage(state);
    const sources: BlurSource[] = [image ? { image } : { color: "white" }];
    if (backdrop.fill) {
      sources.push({
        image: fillCanvas,
        opacity: backdrop.opacity,
        blend: image ? backdrop.blend : "source-over",
      });
    }
    return sources;
  }, [fillCanvas]);
  const backgroundBlur = useMemo(
    () => createBackgroundBlur(canvasSize, { getBackground, getScratch }),
    [canvasSize, getBackground, getScratch]
  );

  // El fondo desenfocado se muestra con un nodo que se rellena desde aquí,
  // fuera de React, igual que los rasters.
  const showBackgroundBlur = useCallback(() => {
    const node = blurNodeRef.current;
    if (!node) return;
    const { view } = backgroundBlur;
    const wasVisible = node.visible();
    // Sin desenfoque no se queda con ningún canvas (p. ej. el del documento
    // anterior) ni hay nada que repintar.
    node.image(view ?? undefined);
    node.visible(view !== null);
    if (view || wasVisible) backgroundLayerRef.current?.batchDraw();
  }, [backgroundBlur, backgroundLayerRef]);

  const liveBlur = useMemo<LiveBlur>(
    () => ({
      // Todo lo que se ve bajo los textos, desenfocado: fondo, resaltador
      // (multiplicado, como en pantalla) y pintura.
      snapshot() {
        // Esta copia es de un instante: con un video en marcha, el trazo
        // mostraría un fotograma congelado. Se pausa al empezar a desenfocar.
        selectVideo(editorStore.getState())?.element.pause();
        const { highlight } = selectStrokeLayers(editorStore.getState());
        const sources = getBackground();
        if (backgroundBlur.view) sources.push({ image: backgroundBlur.view });
        if (highlight.length > 0) {
          sources.push({ image: highlightRaster.canvas, blend: "multiply" });
        }
        sources.push({ image: raster.canvas });
        blurSnapshotRef.current = blurLayers(sources, canvasSize, {
          into: blurSnapshotRef.current,
        });
        return blurSnapshotRef.current;
      },
      setLiveEraser(eraser) {
        backgroundBlur.setLiveEraser(eraser);
        // Al soltar el borrador, lo borrado ya no depende del trazo en curso.
        if (!eraser && backgroundBlur.view) {
          backgroundLayerRef.current?.batchDraw();
        }
      },
    }),
    [
      backgroundBlur,
      backgroundLayerRef,
      canvasSize,
      getBackground,
      highlightRaster,
      raster,
    ]
  );

  // Va después de `paintBackdrop` (`useBackdropCanvas` se llama antes y los
  // efectos van en orden): la capa de color ya está repintada cuando se
  // vuelve a desenfocar el fondo.
  useEffect(
    function blurNewBackground() {
      backgroundBlur.invalidateBackground();
      showBackgroundBlur();
    },
    [backgroundBlur, showBackgroundBlur, backdrop, background]
  );

  return { backgroundBlur, blurNodeRef, showBackgroundBlur, liveBlur };
};
