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
import { createCanvas } from "../../lib/canvas";
import { PaintRaster } from "../engine/PaintRaster";
import { editorStore, useEditorStore } from "../store/editorStore";
import { selectStrokes } from "../store/selectors";
import styles from "./EditorStage.module.css";
import ElementsLayer from "./ElementsLayer";
import TextEditorOverlay from "./TextEditorOverlay";
import { useStageInput } from "./useStageInput";
import { useViewStore, viewStore } from "./viewStore";

/**
 * Lienzo del editor con Konva.
 *
 * Dos capas (cada Layer de Konva es su propio <canvas>):
 * - fondo: la foto o un rectángulo blanco;
 * - pintura: los trazos terminados (raster en caché) y el trazo en curso.
 *   Al estar separadas, el borrador quita pintura sin tocar la foto.
 *
 * Encima, los textos e imágenes (ElementsLayer) y una capa sin transformar
 * con el círculo del tamaño del pincel.
 *
 * Todas las capas del documento se dibujan con la transformación de la vista
 * (posición y escala), así que todo se guarda en coordenadas del documento.
 */
const EditorStage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<KonvaStage>(null);
  const paintLayerRef = useRef<KonvaLayer>(null);
  const liveNodeRef = useRef<KonvaImageNode>(null);
  const cursorRef = useRef<KonvaGroup>(null);

  const canvasSize = useEditorStore((state) => state.canvasSize);
  const preview = useEditorStore((state) => state.background.preview);
  const isDrawing = useEditorStore((state) => state.mode === "draw");
  const isEditingElements = useEditorStore((state) => state.mode === "text");
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

  // Un pellizco suelta el elemento que Konva estuviera arrastrando.
  const stopElementDrags = useCallback(() => {
    for (const node of stageRef.current?.find(
      (candidate: { isDragging: () => boolean }) => candidate.isDragging()
    ) ?? []) {
      node.stopDrag();
    }
  }, []);

  useStageInput({
    containerRef,
    canDraw: isDrawing,
    canNavigate: isDrawing || isEditingElements,
    liveCanvas,
    liveNodeRef,
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
        <ElementsLayer view={view} interactive={isEditingElements} />
        <Layer listening={false}>
          {/* Dos círculos (blanco y negro) para que se vea sobre cualquier color. */}
          <Group ref={cursorRef} visible={false}>
            <Circle
              radius={1}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={3}
            />
            <Circle radius={1} stroke="rgba(0, 0, 0, 0.9)" strokeWidth={1} />
          </Group>
        </Layer>
      </Stage>
      <TextEditorOverlay />
    </div>
  );
};

export default EditorStage;
