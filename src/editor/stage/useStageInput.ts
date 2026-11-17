import type { Group as KonvaGroup } from "konva/lib/Group";
import type { Circle as KonvaCircle } from "konva/lib/shapes/Circle";
import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import { useEffect, type RefObject } from "react";
import { isTypingTarget } from "../../lib/isTypingTarget";
import { getLocalPoint, getPointerSamples } from "../engine/pointer";
import { pinchView, type View } from "../engine/viewport";
import type { Point } from "../model/types";
import { editorStore } from "../store/editorStore";
import { createStrokeSession, type LiveBlur } from "./strokeSession";
import { selectZoomLimits, viewStore } from "./viewStore";

/**
 * Si un segundo dedo toca la pantalla antes de este tiempo, el trazo que
 * empezó el primero se descarta: era el inicio de un pellizco, no un dibujo.
 */
const MULTI_TOUCH_CANCEL_MS = 300;
/** Un toque con dos dedos: más corto que esto y casi sin moverse. */
const TWO_FINGER_TAP_MS = 250;
const TWO_FINGER_TAP_SLOP = 10;
/** Dos toques con dos dedos en este tiempo = ajustar a pantalla. */
const DOUBLE_TAP_MS = 400;
/** Sensibilidad del zoom con Ctrl + rueda (y el pellizco del trackpad). */
const WHEEL_ZOOM_SPEED = 0.002;

type Gesture =
  | { kind: "idle" }
  | { kind: "drawing"; pointerId: number }
  | { kind: "panning"; pointerId: number; last: Point }
  | {
      kind: "pinching";
      ids: [number, number];
      start: { view: View; mid: Point; distance: number };
      startedAt: number;
      moved: boolean;
    };

interface StageInputOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  /** Dibujar con un dedo, el ratón o el lápiz (modo Dibujar). */
  canDraw: boolean;
  /** Zoom y desplazamiento (modo Dibujar y modo Texto). */
  canNavigate: boolean;
  liveCanvas: HTMLCanvasElement;
  /** Nodos del trazo en curso en la capa de pintura y en la del resaltador. */
  liveNodeRef: RefObject<KonvaImageNode | null>;
  highlightLiveNodeRef: RefObject<KonvaImageNode | null>;
  /** Grupo de Konva con los círculos que marcan el tamaño del pincel. */
  cursorRef: RefObject<KonvaGroup | null>;
  requestDraw: () => void;
  /** Lo que el trazo en curso necesita para el desenfoque (ver `LiveBlur`). */
  liveBlur: LiveBlur;
  /**
   * Empieza un pellizco: en modo Texto hay que soltar el elemento que Konva
   * estuviera arrastrando con el primer dedo.
   */
  onPinchStart?: () => void;
}

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Toda la entrada del lienzo con Pointer Events (ratón, dedo y lápiz):
 *
 * - dibujar: botón principal, un dedo o la punta del lápiz;
 * - desplazar: espacio + arrastrar, botón central o la rueda;
 * - zoom: Ctrl/⌘ + rueda, pellizco del trackpad o con dos dedos;
 * - ajustar a pantalla: doble toque con dos dedos.
 *
 * Es una pequeña máquina de estados (`gesture`): así un gesto nunca deja un
 * trazo a medias y un trazo nunca se convierte en gesto por accidente. Los
 * listeners son nativos y el estado vive en variables locales del efecto, de
 * modo que nada de esto provoca renders de React.
 */
export function useStageInput({
  containerRef,
  canDraw,
  canNavigate,
  liveCanvas,
  liveNodeRef,
  highlightLiveNodeRef,
  cursorRef,
  requestDraw,
  liveBlur,
  onPinchStart,
}: StageInputOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if ((!canDraw && !canNavigate) || !container) return;

    const strokes = createStrokeSession({
      liveCanvas,
      liveNodes: {
        paint: liveNodeRef.current,
        highlight: highlightLiveNodeRef.current,
      },
      requestDraw,
      liveBlur,
    });
    /** Dedos apoyados, en coordenadas del área del lienzo. */
    const touches = new Map<number, Point>();
    let gesture: Gesture = { kind: "idle" };
    let isPenDown = false;
    let isSpaceDown = false;
    let isPointerOver = false;
    let lastTwoFingerTap = 0;
    let rect = container.getBoundingClientRect();

    const local = (event: { clientX: number; clientY: number }) =>
      getLocalPoint(event, rect);

    const setPanCursor = (state: "ready" | "active" | null) => {
      if (state) container.dataset.pan = state;
      else delete container.dataset.pan;
    };

    // ------------------------------------------------ cursor del pincel

    const showBrushCursor = (point: Point) => {
      const cursor = cursorRef.current;
      if (!cursor || !canDraw) return;
      const { brush } = editorStore.getState();
      const { view } = viewStore.getState();
      const radius = Math.max(
        1,
        (brush.settings[brush.presetId].size / 2) * view.scale
      );
      cursor.position(point);
      for (const circle of cursor.getChildren()) {
        (circle as KonvaCircle).radius(radius);
      }
      cursor.visible(true);
      cursor.getLayer()?.batchDraw();
    };

    const hideBrushCursor = () => {
      const cursor = cursorRef.current;
      if (!cursor?.visible()) return;
      cursor.visible(false);
      cursor.getLayer()?.batchDraw();
    };

    // ------------------------------------------------ gestos

    const startPinch = () => {
      const [[idA, a], [idB, b]] = [...touches];
      gesture = {
        kind: "pinching",
        ids: [idA, idB],
        start: {
          view: viewStore.getState().view,
          mid: midpoint(a, b),
          distance: Math.max(1, distance(a, b)),
        },
        startedAt: performance.now(),
        moved: false,
      };
    };

    const updatePinch = () => {
      if (gesture.kind !== "pinching") return;
      const a = touches.get(gesture.ids[0]);
      const b = touches.get(gesture.ids[1]);
      if (!a || !b) return;
      const mid = midpoint(a, b);
      const spread = distance(a, b);
      if (
        distance(mid, gesture.start.mid) > TWO_FINGER_TAP_SLOP ||
        Math.abs(spread - gesture.start.distance) > TWO_FINGER_TAP_SLOP
      ) {
        gesture.moved = true;
      }
      const view = viewStore.getState();
      view.setView(
        pinchView(gesture.start, mid, spread, selectZoomLimits(view))
      );
    };

    const endPinch = () => {
      if (gesture.kind !== "pinching") return;
      const now = performance.now();
      const isTap =
        !gesture.moved && now - gesture.startedAt < TWO_FINGER_TAP_MS;
      gesture = { kind: "idle" };
      if (!isTap) return;
      if (now - lastTwoFingerTap < DOUBLE_TAP_MS) {
        viewStore.getState().fitToScreen();
        lastTwoFingerTap = 0;
      } else {
        lastTwoFingerTap = now;
      }
    };

    // ------------------------------------------------ puntero

    /**
     * Mide el área del lienzo y, si cambió y el ResizeObserver aún no avisó
     * (p. ej. se empieza a dibujar en el mismo frame en que aparece la
     * cabecera), actualiza la vista antes de convertir coordenadas.
     */
    const measure = () => {
      rect = container.getBoundingClientRect();
      const { stageSize, setStageSize } = viewStore.getState();
      if (rect.width !== stageSize.width || rect.height !== stageSize.height) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    const capture = (pointerId: number) => {
      try {
        container.setPointerCapture(pointerId);
      } catch {
        // El puntero ya no está activo: todo funciona igual, sin captura.
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      measure();
      const point = local(event);

      if (event.pointerType === "touch") {
        touches.set(event.pointerId, point);
        hideBrushCursor();
        // Con el lápiz apoyado, los toques son la palma de la mano.
        if (isPenDown) return;
        if (touches.size === 2) {
          if (gesture.kind === "drawing") {
            // Un trazo que ya lleva un rato no se convierte en gesto.
            if (strokes.age() > MULTI_TOUCH_CANCEL_MS) return;
            strokes.cancel();
            gesture = { kind: "idle" };
          }
          if (gesture.kind === "idle" && canNavigate) {
            onPinchStart?.();
            startPinch();
          }
          return;
        }
        if (touches.size > 2) return;
      }

      if (gesture.kind !== "idle") return;

      // Desplazar: botón central, o espacio + botón principal.
      const wantsPan =
        event.button === 1 || (event.button === 0 && isSpaceDown);
      if (wantsPan && canNavigate) {
        event.preventDefault();
        capture(event.pointerId);
        gesture = { kind: "panning", pointerId: event.pointerId, last: point };
        setPanCursor("active");
        hideBrushCursor();
        return;
      }

      // Dibujar: solo el botón principal (clic izquierdo, dedo, punta del
      // lápiz). En modo Texto ese puntero es de Konva (seleccionar, arrastrar).
      if (event.button !== 0 || !canDraw) return;
      event.preventDefault();
      capture(event.pointerId);
      if (event.pointerType === "pen") isPenDown = true;
      gesture = { kind: "drawing", pointerId: event.pointerId };
      strokes.start(event, rect);
    };

    const onPointerMove = (event: PointerEvent) => {
      isPointerOver = true;
      const point = local(event);
      if (event.pointerType === "touch" && touches.has(event.pointerId)) {
        touches.set(event.pointerId, point);
      }
      const isHoverDevice = event.pointerType !== "touch";

      switch (gesture.kind) {
        case "drawing":
          if (gesture.pointerId !== event.pointerId) return;
          strokes.extend(getPointerSamples(event), rect);
          if (isHoverDevice) showBrushCursor(point);
          return;
        case "panning":
          if (gesture.pointerId !== event.pointerId) return;
          viewStore
            .getState()
            .panBy(point.x - gesture.last.x, point.y - gesture.last.y);
          gesture.last = point;
          return;
        case "pinching":
          updatePinch();
          return;
        case "idle":
          // Ratón o lápiz en el aire: el círculo muestra el tamaño del pincel.
          if (isHoverDevice && !isSpaceDown) showBrushCursor(point);
      }
    };

    const release = (event: PointerEvent, commit: boolean) => {
      touches.delete(event.pointerId);
      if (event.pointerType === "pen") isPenDown = false;

      if (gesture.kind === "drawing" && gesture.pointerId === event.pointerId) {
        if (commit) strokes.finish();
        else strokes.cancel();
        gesture = { kind: "idle" };
      } else if (
        gesture.kind === "panning" &&
        gesture.pointerId === event.pointerId
      ) {
        gesture = { kind: "idle" };
        setPanCursor(isSpaceDown ? "ready" : null);
      } else if (
        gesture.kind === "pinching" &&
        gesture.ids.includes(event.pointerId)
      ) {
        // El dedo que queda no empieza a dibujar: solo un pointerdown nuevo
        // inicia un trazo.
        if (commit) endPinch();
        else gesture = { kind: "idle" };
      }
    };

    const onPointerUp = (event: PointerEvent) => release(event, true);
    // El sistema interrumpió el puntero (p. ej. una notificación): se descarta.
    const onPointerCancel = (event: PointerEvent) => release(event, false);
    const onPointerLeave = () => {
      isPointerOver = false;
      hideBrushCursor();
    };

    // ------------------------------------------------ rueda y teclado

    const onWheel = (event: WheelEvent) => {
      if (!canNavigate) return;
      // Sin esto, Ctrl + rueda haría zoom de toda la página.
      event.preventDefault();
      measure();
      const lineHeight = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
      const dx = event.deltaX * lineHeight;
      const dy = event.deltaY * lineHeight;
      const point = local(event);
      const view = viewStore.getState();

      if (event.ctrlKey || event.metaKey) {
        // El pellizco del trackpad también llega como Ctrl + rueda.
        view.zoomAt(point, Math.exp(-dy * WHEEL_ZOOM_SPEED));
        showBrushCursor(point);
      } else if (event.shiftKey && !dx) {
        view.panBy(-dy, 0);
      } else {
        view.panBy(-dx, -dy);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!canNavigate) return;
      if (event.code !== "Space" || isTypingTarget(event.target)) return;
      // Si un botón tiene el foco y el puntero no está sobre el lienzo, el
      // espacio es para el botón (navegación con teclado).
      const isFocusOnControl = event.target !== document.body;
      if (isFocusOnControl && !isPointerOver) return;
      // Evita que el espacio "pulse" el botón que tenga el foco.
      event.preventDefault();
      if (isSpaceDown) return;
      isSpaceDown = true;
      if (gesture.kind === "idle") setPanCursor("ready");
      hideBrushCursor();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      isSpaceDown = false;
      if (gesture.kind !== "panning") setPanCursor(null);
    };

    // Si la ventana pierde el foco con el espacio apretado, nunca llega keyup.
    const onBlur = () => {
      isSpaceDown = false;
      if (gesture.kind !== "panning") setPanCursor(null);
    };

    // Mantener presionado en el móvil no debe abrir el menú contextual.
    const onContextMenu = (event: Event) => event.preventDefault();

    const listeners: [
      EventTarget,
      string,
      EventListener,
      AddEventListenerOptions?,
    ][] = [
      [container, "pointerdown", onPointerDown as EventListener],
      [container, "pointermove", onPointerMove as EventListener],
      [container, "pointerup", onPointerUp as EventListener],
      [container, "pointercancel", onPointerCancel as EventListener],
      [container, "pointerleave", onPointerLeave],
      [container, "wheel", onWheel as EventListener, { passive: false }],
      [container, "contextmenu", onContextMenu],
      [window, "keydown", onKeyDown as EventListener],
      [window, "keyup", onKeyUp as EventListener],
      [window, "blur", onBlur],
    ];
    for (const [target, type, listener, options] of listeners) {
      target.addEventListener(type, listener, options);
    }
    return () => {
      for (const [target, type, listener, options] of listeners) {
        target.removeEventListener(type, listener, options);
      }
      strokes.cancel();
      hideBrushCursor();
      setPanCursor(null);
    };
  }, [
    containerRef,
    canDraw,
    canNavigate,
    liveCanvas,
    liveNodeRef,
    highlightLiveNodeRef,
    cursorRef,
    requestDraw,
    liveBlur,
    onPinchStart,
  ]);
}
