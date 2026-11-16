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
import { blurLayers, type BlurSource } from "../engine/brushes/blur";
import { paintFill } from "../engine/fill/paintFill";
import { editorStore, useEditorStore } from "../store/editorStore";
import { selectStrokeLayers } from "../store/selectors";
import { createBackgroundBlur } from "./backgroundBlur";
import styles from "./EditorStage.module.css";
import ElementsLayer from "./ElementsLayer";
import type { LiveBlur } from "./strokeSession";
import TextEditorOverlay from "./TextEditorOverlay";
import { useStageInput } from "./useStageInput";
import { useViewStore, viewStore } from "./viewStore";

/**
 * Lienzo del editor con Konva.
 *
 * Tres capas (cada Layer de Konva es su propio <canvas>):
 * - fondo: la foto o un rectángulo blanco, la capa de color o degradado y,
 *   donde pasó el pincel de desenfoque, ese mismo fondo desenfocado;
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
  const blurNodeRef = useRef<KonvaImageNode>(null);
  const blurSnapshotRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<KonvaGroup>(null);

  const canvasSize = useEditorStore((state) => state.canvasSize);
  const preview = useEditorStore((state) => state.photo.preview);
  const backdrop = useEditorStore((state) => state.backdrop);
  const isDrawing = useEditorStore((state) => state.mode === "draw");
  const isEditingElements = useEditorStore((state) => state.mode === "text");
  const stageSize = useViewStore((state) => state.stageSize);
  const view = useViewStore((state) => state.view);

  // Búfer de trazo (opacidad, fusión, máscaras) compartido por los rasters:
  // se pintan de uno en uno. Se crea al usarse por primera vez.
  const getScratch = useMemo(() => {
    let scratch: HTMLCanvasElement | null = null;
    return () => (scratch ??= createCanvas(canvasSize));
  }, [canvasSize]);
  // Un raster por capa de trazos y un canvas para el trazo en curso por cada
  // tamaño de documento.
  const raster = useMemo(
    () => new PaintRaster(canvasSize, { getScratch }),
    [canvasSize, getScratch]
  );
  const highlightRaster = useMemo(
    () => new PaintRaster(canvasSize, { getScratch }),
    [canvasSize, getScratch]
  );
  const liveCanvas = useMemo(() => createCanvas(canvasSize), [canvasSize]);
  // Capa de color o degradado: un canvas por tamaño de documento que se
  // repinta al cambiar (no se crea uno nuevo en cada movimiento de un control).
  const fillCanvas = useMemo(() => createCanvas(canvasSize), [canvasSize]);

  // El fondo tal como se ve (lo mismo que pinta la capa de fondo, abajo): es
  // lo que desenfoca el pincel de desenfoque.
  const getBackground = useCallback((): BlurSource[] => {
    const { photo, backdrop } = editorStore.getState();
    const sources: BlurSource[] = [
      photo.preview ? { image: photo.preview } : { color: "white" },
    ];
    if (backdrop.fill) {
      sources.push({
        image: fillCanvas,
        opacity: backdrop.opacity,
        blend: photo.preview ? backdrop.blend : "source-over",
      });
    }
    return sources;
  }, [fillCanvas]);
  const backgroundBlur = useMemo(
    () => createBackgroundBlur(canvasSize, { getBackground, getScratch }),
    [canvasSize, getBackground, getScratch]
  );

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
  }, [backgroundBlur]);

  const liveBlur = useMemo<LiveBlur>(
    () => ({
      // Todo lo que se ve bajo los textos, desenfocado: fondo, resaltador
      // (multiplicado, como en pantalla) y pintura.
      snapshot() {
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
    [backgroundBlur, canvasSize, getBackground, highlightRaster, raster]
  );

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

  useEffect(
    function paintBackdrop() {
      const ctx = get2dContext(fillCanvas);
      ctx.clearRect(0, 0, fillCanvas.width, fillCanvas.height);
      if (backdrop.fill) paintFill(ctx, backdrop.fill, canvasSize);
      backgroundLayerRef.current?.batchDraw();
    },
    [fillCanvas, backdrop.fill, canvasSize]
  );

  // Después de `paintBackdrop` (los efectos van en orden): la capa de color
  // ya está repintada cuando se vuelve a desenfocar el fondo.
  useEffect(
    function blurNewBackground() {
      backgroundBlur.invalidateBackground();
      showBackgroundBlur();
    },
    [backgroundBlur, showBackgroundBlur, backdrop, preview]
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
