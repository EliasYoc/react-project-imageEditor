import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import "konva/lib/shapes/Image";
import "konva/lib/shapes/Rect";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
// Versión mínima de react-konva: solo se registran las formas que se usan
// (Image y Rect, arriba) en lugar de todas las de Konva.
import {
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
} from "react-konva/lib/ReactKonvaCore";
import { createCanvas } from "../../lib/canvas";
import { PaintRaster } from "../engine/PaintRaster";
import { fitView } from "../engine/viewport";
import { editorStore, useEditorStore } from "../store/editorStore";
import { selectStrokes } from "../store/selectors";
import styles from "./EditorStage.module.css";
import { useDrawingInput } from "./useDrawingInput";
import { useViewStore, viewStore } from "./viewStore";

/**
 * Lienzo del editor con Konva.
 *
 * Dos capas (cada Layer de Konva es su propio <canvas>):
 * - fondo: la foto o un rectángulo blanco;
 * - pintura: los trazos terminados (raster en caché) y el trazo en curso.
 *   Al estar separadas, el borrador quita pintura sin tocar la foto.
 *
 * Ambas se dibujan con la transformación de la vista (posición y escala), así
 * que todo se guarda en coordenadas del documento.
 */
const EditorStage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paintLayerRef = useRef<KonvaLayer>(null);
  const liveNodeRef = useRef<KonvaImageNode>(null);

  const canvasSize = useEditorStore((state) => state.canvasSize);
  const preview = useEditorStore((state) => state.background.preview);
  const isDrawing = useEditorStore((state) => state.mode === "draw");
  const stageSize = useViewStore((state) => state.stageSize);
  const view = useViewStore((state) => state.view);

  // Un raster y un canvas para el trazo en curso por cada tamaño de documento.
  const raster = useMemo(() => new PaintRaster(canvasSize), [canvasSize]);
  const liveCanvas = useMemo(() => createCanvas(canvasSize), [canvasSize]);

  // batchDraw agrupa las peticiones y pinta una sola vez por frame.
  const requestDraw = useCallback(() => paintLayerRef.current?.batchDraw(), []);

  useLayoutEffect(function measureStage() {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      viewStore.getState().setStageSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(
    function fitDocument() {
      viewStore.getState().setView(fitView(stageSize, canvasSize));
    },
    [stageSize, canvasSize]
  );

  useEffect(
    function syncPaintWithStore() {
      // Fuera de React: los trazos no pasan por el render, el raster se pone
      // al día directamente cuando cambia el documento (dibujar, deshacer...).
      const sync = () => {
        raster.sync(selectStrokes(editorStore.getState()));
        requestDraw();
      };
      sync();
      return editorStore.subscribe((state, previous) => {
        if (state.log !== previous.log) sync();
      });
    },
    [raster, requestDraw]
  );

  useDrawingInput({
    containerRef,
    enabled: isDrawing,
    liveCanvas,
    liveNodeRef,
    requestDraw,
  });

  const documentTransform = {
    x: view.x,
    y: view.y,
    scaleX: view.scale,
    scaleY: view.scale,
    listening: false,
  };

  return (
    <div
      ref={containerRef}
      className={styles.stage}
      data-drawing={isDrawing || undefined}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        listening={false}
      >
        <Layer {...documentTransform}>
          {preview ? (
            <KonvaImage
              image={preview}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          ) : (
            <Rect
              width={canvasSize.width}
              height={canvasSize.height}
              fill="white"
            />
          )}
        </Layer>
        <Layer ref={paintLayerRef} {...documentTransform}>
          <KonvaImage
            image={raster.canvas}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <KonvaImage
            ref={liveNodeRef}
            image={liveCanvas}
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default EditorStage;
