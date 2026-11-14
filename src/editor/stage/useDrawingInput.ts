import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import { useEffect, type RefObject } from "react";
import { get2dContext } from "../../lib/canvas";
import { getPointerSamples, toStrokePoint } from "../engine/pointer";
import {
  createSprayState,
  renderStroke,
  stampSpray,
  strokeComposite,
  type SprayState,
} from "../engine/renderStroke";
import { createStroke } from "../model/factories";
import type { StrokeEntry, StrokePoint } from "../model/types";
import { editorStore } from "../store/editorStore";
import { viewStore } from "./viewStore";

/**
 * Si un segundo dedo toca la pantalla antes de este tiempo, el trazo que
 * empezó el primero se descarta: era el inicio de un gesto, no un dibujo.
 */
const MULTI_TOUCH_CANCEL_MS = 300;

interface ActiveStroke {
  pointerId: number;
  stroke: StrokeEntry;
  points: StrokePoint[];
  spray: SprayState;
  startedAt: number;
}

interface DrawingInputOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  /** Canvas (tamaño del documento) donde se ve el trazo mientras se dibuja. */
  liveCanvas: HTMLCanvasElement;
  /** Nodo de Konva que muestra `liveCanvas`. */
  liveNodeRef: RefObject<KonvaImageNode | null>;
  /** Pide a Konva que vuelva a pintar la capa de pintura en el próximo frame. */
  requestDraw: () => void;
}

/**
 * Entrada del dibujo con Pointer Events: un solo código para ratón, dedo y
 * lápiz (antes había handlers de ratón y de touch por separado).
 *
 * - `setPointerCapture`: el trazo sigue aunque el puntero salga del lienzo.
 * - Eventos agrupados (`getCoalescedEvents`) y presión en cada punto.
 * - Un segundo dedo al empezar cancela el trazo; mientras el lápiz está
 *   apoyado se ignoran los toques (la palma de la mano).
 *
 * Los listeners son nativos (no props de React) y el trazo en curso vive en
 * variables locales del efecto: dibujar no provoca ningún render.
 */
export function useDrawingInput({
  containerRef,
  enabled,
  liveCanvas,
  liveNodeRef,
  requestDraw,
}: DrawingInputOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const ctx = get2dContext(liveCanvas);
    const touches = new Set<number>();
    let isPenDown = false;
    let active: ActiveStroke | null = null;
    let rect = container.getBoundingClientRect();

    const clearLive = () =>
      ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);

    const extend = (samples: ReturnType<typeof getPointerSamples>) => {
      if (!active) return;
      const { view } = viewStore.getState();
      const newPoints = samples.map((sample) =>
        toStrokePoint(sample, rect, view)
      );
      active.points.push(...newPoints);

      if (active.stroke.brush === "spray") {
        // Las manchas del spray se acumulan: basta con pintar las nuevas.
        active.spray = stampSpray(ctx, active.stroke, newPoints, active.spray);
      } else {
        // La línea se repinta entera: si solo se añadiera el último tramo, las
        // uniones de un color semitransparente se verían más oscuras.
        clearLive();
        renderStroke(ctx, { ...active.stroke, points: active.points });
      }
      requestDraw();
    };

    const cancel = () => {
      active = null;
      clearLive();
      requestDraw();
    };

    const finish = () => {
      if (!active) return;
      const { stroke, points } = active;
      active = null;
      // El raster se actualiza solo: está suscrito a los trazos del store.
      editorStore.getState().addStroke({ ...stroke, points });
      clearLive();
      requestDraw();
    };

    const release = (event: PointerEvent) => {
      touches.delete(event.pointerId);
      if (event.pointerType === "pen") isPenDown = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        touches.add(event.pointerId);
        if (isPenDown) return;
        if (touches.size > 1) {
          const isJustStarted =
            active &&
            performance.now() - active.startedAt < MULTI_TOUCH_CANCEL_MS;
          if (isJustStarted) cancel();
          return;
        }
      }
      // Solo el botón principal (clic izquierdo, dedo o punta del lápiz).
      if (active || event.button !== 0) return;

      event.preventDefault();
      try {
        container.setPointerCapture(event.pointerId);
      } catch {
        // El puntero ya no está activo (p. ej. se levantó en el mismo frame):
        // el trazo funciona igual, solo que sin captura.
      }
      if (event.pointerType === "pen") isPenDown = true;
      rect = container.getBoundingClientRect();

      const { brush } = editorStore.getState();
      const stroke = createStroke(brush.type, brush.settings[brush.type]);
      // El trazo en curso se dibuja opaco en su canvas; el modo de fusión (p. ej.
      // borrar) se aplica al mostrarlo sobre la capa de pintura.
      liveNodeRef.current?.globalCompositeOperation(strokeComposite(stroke));
      active = {
        pointerId: event.pointerId,
        stroke,
        points: [],
        spray: createSprayState(),
        startedAt: performance.now(),
      };
      extend([event]);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (active?.pointerId === event.pointerId) {
        extend(getPointerSamples(event));
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      release(event);
      if (active?.pointerId === event.pointerId) finish();
    };

    // El sistema interrumpió el puntero (p. ej. una notificación): se descarta.
    const onPointerCancel = (event: PointerEvent) => {
      release(event);
      if (active?.pointerId === event.pointerId) cancel();
    };

    // Mantener presionado en el móvil no debe abrir el menú contextual.
    const onContextMenu = (event: Event) => event.preventDefault();

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerCancel);
    container.addEventListener("contextmenu", onContextMenu);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerCancel);
      container.removeEventListener("contextmenu", onContextMenu);
      if (active) cancel();
    };
  }, [containerRef, enabled, liveCanvas, liveNodeRef, requestDraw]);
}
