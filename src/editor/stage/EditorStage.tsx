import type { Group as KonvaGroup } from "konva/lib/Group";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import "konva/lib/shapes/Circle";
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
// (Circle, Image y Rect, arriba) en lugar de todas las de Konva.
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
} from "react-konva/lib/ReactKonvaCore";
import { createCanvas, get2dContext } from "../../lib/canvas";
import { PaintRaster } from "../engine/PaintRaster";
import { paintFill } from "../engine/fill/paintFill";
import { editorStore, useEditorStore } from "../store/editorStore";
import { selectStrokeLayers } from "../store/selectors";
import styles from "./EditorStage.module.css";
import ElementsLayer from "./ElementsLayer";
import TextEditorOverlay from "./TextEditorOverlay";
import { useStageInput } from "./useStageInput";
import { useViewStore, viewStore } from "./viewStore";

/**
 * Lienzo del editor con Konva.
 *
 * Tres capas (cada Layer de Konva es su propio <canvas>):
 * - fondo: la foto o un rectángulo blanco, y la capa de color o degradado;
 * - resaltador: sus trazos, en un raster aparte cuyo <canvas> se MULTIPLICA
 *   con el fondo (`mix-blend-mode`): tiñe la foto como un rotulador real;
 * - pintura: los trazos terminados (raster en caché) y el trazo en curso.
 *   Al estar separadas, el borrador quita pintura sin tocar la foto.
 *
 * Encima, los textos e imágenes (ElementsLayer) y su capa sin transformar,
 * con el marco de selección y el círculo del tamaño del pincel. En total
 * cinco capas: Konva recomienda no pasar de ahí (cada una es un <canvas>).
 *
 * Todas las capas del documento se dibujan con la transformación de la vista
 * (posición y escala), así que todo se guarda en coordenadas del documento.
 */
const EditorStage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<KonvaStage>(null);
  const paintLayerRef = useRef<KonvaLayer>(null);
  const highlightLayerRef = useRef<KonvaLayer>(null);
  const backgroundLayerRef = useRef<KonvaLayer>(null);
  const liveNodeRef = useRef<KonvaImageNode>(null);
  const highlightLiveNodeRef = useRef<KonvaImageNode>(null);
  const cursorRef = useRef<KonvaGroup>(null);

  const canvasSize = useEditorStore((state) => state.canvasSize);
  const preview = useEditorStore((state) => state.photo.preview);
  const backdrop = useEditorStore((state) => state.backdrop);
  const isDrawing = useEditorStore((state) => state.mode === "draw");
  const isEditingElements = useEditorStore((state) => state.mode === "text");
  const stageSize = useViewStore((state) => state.stageSize);
  const view = useViewStore((state) => state.view);

  // Un raster por capa de trazos y un canvas para el trazo en curso por cada
  // tamaño de documento.
  const raster = useMemo(() => new PaintRaster(canvasSize), [canvasSize]);
  const highlightRaster = useMemo(
    () => new PaintRaster(canvasSize),
    [canvasSize]
  );
  const liveCanvas = useMemo(() => createCanvas(canvasSize), [canvasSize]);
  // Capa de color o degradado: un canvas por tamaño de documento que se
  // repinta al cambiar (no se crea uno nuevo en cada movimiento de un control).
  const fillCanvas = useMemo(() => createCanvas(canvasSize), [canvasSize]);

  // batchDraw agrupa las peticiones y pinta una sola vez por frame.
  const requestDraw = useCallback(() => {
    paintLayerRef.current?.batchDraw();
    highlightLayerRef.current?.batchDraw();
  }, []);

  useLayoutEffect(function multiplyHighlightLayer() {
    // El <canvas> de la capa se multiplica con lo que tiene debajo (el fondo):
    // el blanco no cambia nada y el color tiñe la foto sin taparla.
    const canvas = highlightLayerRef.current?.getNativeCanvasElement();
    if (canvas) canvas.style.mixBlendMode = "multiply";
  }, []);

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
    function fitNewDocument() {
      viewStore.getState().fitToScreen();
    },
    [canvasSize]
  );

  useEffect(
    function syncPaintWithStore() {
      // Fuera de React: los trazos no pasan por el render, el raster se pone
      // al día directamente cuando cambia el documento (dibujar, deshacer...).
      const sync = () => {
        const { paint, highlight } = selectStrokeLayers(editorStore.getState());
        raster.sync(paint);
        highlightRaster.sync(highlight);
        // Sin resaltador, su capa no se compone (ni se multiplica) en cada frame.
        highlightLayerRef.current?.visible(highlight.length > 0);
        requestDraw();
      };
      sync();
      return editorStore.subscribe((state, previous) => {
        if (state.log !== previous.log) sync();
      });
    },
    [raster, highlightRaster, requestDraw]
  );

  // Un pellizco suelta el elemento que Konva estuviera arrastrando.
  const stopElementDrags = useCallback(() => {
    for (const node of stageRef.current?.find(
      (candidate: { isDragging: () => boolean }) => candidate.isDragging()
    ) ?? []) {
      node.stopDrag();
    }
  }, []);

  useEffect(
    function paintBackdrop() {
      const ctx = get2dContext(fillCanvas);
      ctx.clearRect(0, 0, fillCanvas.width, fillCanvas.height);
      if (backdrop.fill) paintFill(ctx, backdrop.fill, canvasSize);
      backgroundLayerRef.current?.batchDraw();
    },
    [fillCanvas, backdrop.fill, canvasSize]
  );

  useStageInput({
    containerRef,
    canDraw: isDrawing,
    canNavigate: isDrawing || isEditingElements,
    liveCanvas,
    liveNodeRef,
    highlightLiveNodeRef,
    cursorRef,
    requestDraw,
    onPinchStart: stopElementDrags,
  });

  // Tocar el fondo (fuera de cualquier elemento) quita la selección.
  const onStagePointerDown = (event: KonvaEventObject<PointerEvent>) => {
    if (event.target === event.target.getStage()) {
      editorStore.getState().selectElement(null);
    }
  };

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
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        listening={isEditingElements}
        onPointerDown={onStagePointerDown}
      >
        <Layer ref={backgroundLayerRef} {...documentTransform}>
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
          {/* Sin foto es el fondo del lienzo; con foto, un filtro encima
              (el modo de fusión solo tiene sentido sobre la foto). */}
          <KonvaImage
            image={fillCanvas}
            width={canvasSize.width}
            height={canvasSize.height}
            visible={Boolean(backdrop.fill)}
            opacity={backdrop.opacity}
            globalCompositeOperation={preview ? backdrop.blend : "source-over"}
          />
        </Layer>
        <Layer ref={highlightLayerRef} {...documentTransform}>
          <KonvaImage
            image={highlightRaster.canvas}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <KonvaImage
            ref={highlightLiveNodeRef}
            image={liveCanvas}
            width={canvasSize.width}
            height={canvasSize.height}
            visible={false}
          />
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
        <ElementsLayer
          view={view}
          interactive={isEditingElements}
          overlay={
            // Dos círculos (blanco y negro) para que se vea sobre cualquier color.
            <Group ref={cursorRef} visible={false} listening={false}>
              <Circle
                radius={1}
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth={3}
              />
              <Circle radius={1} stroke="rgba(0, 0, 0, 0.9)" strokeWidth={1} />
            </Group>
          }
        />
      </Stage>
      <TextEditorOverlay />
    </div>
  );
};

export default EditorStage;
