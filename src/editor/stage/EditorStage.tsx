import type { Group as KonvaGroup } from "konva/lib/Group";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import "konva/lib/shapes/Circle";
import "konva/lib/shapes/Image";
import "konva/lib/shapes/Rect";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
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
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { editorStore, useEditorStore } from "../store/editorStore";
import {
  selectBackgroundImage,
  selectStrokeLayers,
  selectVideo,
} from "../store/selectors";
import styles from "./EditorStage.module.css";
import { startElementPinch, type Touch } from "./elementPinch";
import ElementsLayer from "./ElementsLayer";
import TextEditorOverlay from "./textEditor/TextEditorOverlay";
import { useBackdropCanvas } from "./useBackdropCanvas";
import { useBackgroundBlur } from "./useBackgroundBlur";
import { usePaintRasters } from "./usePaintRasters";
import { useStageInput } from "./useStageInput";
import { onVideoFrame } from "./videoFrames";
import { useViewStore, viewStore } from "./viewStore";

/**
 * Lienzo del editor con Konva.
 *
 * Tres capas (cada Layer de Konva es su propio <canvas>):
 * - fondo: la foto, el video (Konva pinta el fotograma actual del `<video>`)
 *   o un rectángulo blanco, la capa de color o degradado y, donde pasó el
 *   pincel de desenfoque, ese mismo fondo desenfocado;
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
  const background = useEditorStore(selectBackgroundImage);
  const video = useEditorStore(selectVideo);
  const backdrop = useEditorStore((state) => state.backdrop);
  const isDrawing = useEditorStore((state) => state.mode === "draw");
  const isEditingElements = useEditorStore((state) => state.mode === "text");
  const stageSize = useViewStore((state) => state.stageSize);
  const view = useViewStore((state) => state.view);

  const { getScratch, raster, highlightRaster, liveCanvas } =
    usePaintRasters(canvasSize);
  const fillCanvas = useBackdropCanvas(
    canvasSize,
    backdrop.fill,
    backgroundLayerRef
  );
  const { backgroundBlur, blurNodeRef, showBackgroundBlur, liveBlur } =
    useBackgroundBlur({
      canvasSize,
      getScratch,
      raster,
      highlightRaster,
      fillCanvas,
      backgroundLayerRef,
      background,
      backdrop,
    });

  // batchDraw agrupa las peticiones y pinta una sola vez por frame.
  const requestDraw = useCallback(() => {
    // Un borrador en curso quita también el desenfoque del fondo.
    if (backgroundBlur.needsLiveRefresh) {
      backgroundBlur.refresh();
      backgroundLayerRef.current?.batchDraw();
    }
    paintLayerRef.current?.batchDraw();
    highlightLayerRef.current?.batchDraw();
  }, [backgroundBlur]);

  useLayoutEffect(function multiplyHighlightLayer() {
    // El <canvas> de la capa se multiplica con lo que tiene debajo (el fondo):
    // el blanco no cambia nada y el color tiñe la foto sin taparla.
    const canvas = highlightLayerRef.current?.getNativeCanvasElement();
    if (canvas) canvas.style.mixBlendMode = "multiply";
  }, []);

  useResizeObserver(containerRef, function measureStage({ contentRect }) {
    const { width, height } = contentRect;
    viewStore.getState().setStageSize({ width, height });
  });

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
        const { paint, highlight, blur } = selectStrokeLayers(
          editorStore.getState()
        );
        raster.sync(paint);
        highlightRaster.sync(highlight);
        // Sin resaltador, su capa no se compone (ni se multiplica) en cada frame.
        highlightLayerRef.current?.visible(highlight.length > 0);
        backgroundBlur.sync(blur);
        showBackgroundBlur();
        requestDraw();
      };
      sync();
      return editorStore.subscribe((state, previous) => {
        if (state.log !== previous.log) sync();
      });
    },
    [raster, highlightRaster, backgroundBlur, showBackgroundBlur, requestDraw]
  );

  // Un pellizco suelta el elemento que Konva estuviera arrastrando.
  const stopElementDrags = useCallback(() => {
    for (const node of stageRef.current?.find(
      (candidate: { isDragging: () => boolean }) => candidate.isDragging()
    ) ?? []) {
      node.stopDrag();
    }
  }, []);

  // Pellizcar el elemento seleccionado lo escala y lo gira (en vez de zoom).
  const pinchSelectedElement = useCallback(
    (elementId: string, touches: [Touch, Touch]) => {
      const stage = stageRef.current;
      if (!stage) return null;
      return startElementPinch(
        stage,
        elementId,
        viewStore.getState().view,
        touches
      );
    },
    []
  );

  useEffect(
    function followVideoFrames() {
      if (!video) return;
      // Fuera de React, como los trazos: en cada fotograma nuevo se repinta
      // la capa de fondo (Konva vuelve a leer el `<video>`) y, si hay trazos
      // de desenfoque, se rehace la copia desenfocada del fondo.
      return onVideoFrame(video.element, () => {
        backgroundBlur.invalidateBackground();
        backgroundLayerRef.current?.batchDraw();
      });
    },
    [video, backgroundBlur]
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
    liveBlur,
    onPinchStart: stopElementDrags,
    startElementPinch: isEditingElements ? pinchSelectedElement : undefined,
  });

  // Tocar el fondo (fuera de cualquier elemento) quita la selección.
  // Solo el primer dedo: el segundo de un pellizco puede caer fuera del
  // elemento que se está pellizcando.
  const onStagePointerDown = (event: KonvaEventObject<PointerEvent>) => {
    if (event.evt.isPrimary && event.target === event.target.getStage()) {
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
          {background ? (
            <KonvaImage
              image={background}
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
          {/* Sin foto ni video es el fondo del lienzo; con uno de ellos, un
              filtro encima (el modo de fusión solo tiene sentido sobre él). */}
          <KonvaImage
            image={fillCanvas}
            width={canvasSize.width}
            height={canvasSize.height}
            visible={Boolean(backdrop.fill)}
            opacity={backdrop.opacity}
            globalCompositeOperation={
              background ? backdrop.blend : "source-over"
            }
          />
          {/* El fondo desenfocado, solo donde pasó el pincel de desenfoque
              (ver backgroundBlur.ts). Su imagen se pone desde fuera de React. */}
          <KonvaImage
            ref={blurNodeRef}
            image={undefined}
            width={canvasSize.width}
            height={canvasSize.height}
            visible={false}
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
          isInteractive={isEditingElements}
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
