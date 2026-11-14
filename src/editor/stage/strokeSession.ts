import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import { get2dContext } from "../../lib/canvas";
import {
  createLiveRenderer,
  strokeBlend,
  type LiveRenderer,
} from "../engine/brushes/paint";
import { ropeLength, stabilizePoints } from "../engine/brushes/stabilizer";
import { toStrokePoint, type PointerSample } from "../engine/pointer";
import { createStroke } from "../model/factories";
import type { StrokeEntry, StrokePoint } from "../model/types";
import { editorStore } from "../store/editorStore";
import { viewStore } from "./viewStore";

interface ActiveStroke {
  stroke: StrokeEntry;
  /** Puntos ya estabilizados (los que se guardan). */
  points: StrokePoint[];
  /** Ancla del estabilizador y último punto real del puntero. */
  anchor: StrokePoint | null;
  lastRaw: StrokePoint | null;
  /** Longitud de la cuerda del estabilizador, en píxeles del documento. */
  rope: number;
  renderer: LiveRenderer;
  startedAt: number;
}

interface StrokeSessionOptions {
  /** Canvas (tamaño del documento) donde se ve el trazo mientras se dibuja. */
  liveCanvas: HTMLCanvasElement;
  /** Nodo de Konva que muestra `liveCanvas`. */
  liveNode: KonvaImageNode | null;
  /** Pide a Konva que vuelva a pintar la capa de pintura en el próximo frame. */
  requestDraw: () => void;
}

type Rect = Pick<DOMRect, "left" | "top">;

/**
 * El trazo que se está dibujando: lo estabiliza, lo muestra en el canvas del
 * trazo en curso y, al terminar, lo guarda en el store (el raster se
 * actualiza solo).
 *
 * El canvas del trazo en curso es el "búfer" del trazo: la opacidad y el modo
 * de fusión del pincel se los aplica el nodo de Konva al mostrarlo, igual que
 * `paintStroke` al pintarlo en el raster.
 *
 * Vive en variables locales, no en estado de React: dibujar no provoca
 * ningún render.
 */
export const createStrokeSession = ({
  liveCanvas,
  liveNode,
  requestDraw,
}: StrokeSessionOptions) => {
  const ctx = get2dContext(liveCanvas);
  let active: ActiveStroke | null = null;

  const clearLive = () =>
    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);

  const addPoints = (raw: StrokePoint[]) => {
    if (!active || !raw.length) return;
    active.lastRaw = raw[raw.length - 1];
    const { points, anchor } = stabilizePoints(active.anchor, raw, active.rope);
    active.anchor = anchor;
    if (!points.length) return;
    active.points.push(...points);
    active.renderer.update(active.points, points);
    requestDraw();
  };

  const extend = (samples: readonly PointerSample[], rect: Rect) => {
    const { view } = viewStore.getState();
    addPoints(samples.map((sample) => toStrokePoint(sample, rect, view)));
  };

  return {
    /** Milisegundos desde que empezó el trazo (Infinity si no hay ninguno). */
    age: () => (active ? performance.now() - active.startedAt : Infinity),

    start(sample: PointerSample, rect: Rect) {
      const { brush } = editorStore.getState();
      const settings = brush.settings[brush.presetId];
      const stroke = createStroke({
        brush: brush.presetId,
        settings,
        color: brush.color,
        // Solo el lápiz mide la presión de verdad (el ratón y el dedo no).
        hasPressure: sample.pointerType === "pen",
      });
      liveNode?.opacity(stroke.opacity);
      liveNode?.globalCompositeOperation(strokeBlend(stroke));
      clearLive();
      active = {
        stroke,
        points: [],
        anchor: null,
        lastRaw: null,
        rope: ropeLength(settings.stabilizer, viewStore.getState().view.scale),
        renderer: createLiveRenderer(ctx, stroke),
        startedAt: performance.now(),
      };
      extend([sample], rect);
    },

    extend,

    finish() {
      if (!active) return;
      const { stroke, points, anchor, lastRaw } = active;
      active = null;
      // El estabilizador va por detrás del puntero: el trazo termina donde se
      // soltó, no donde se quedó la cuerda.
      const isBehind =
        lastRaw && anchor && (lastRaw.x !== anchor.x || lastRaw.y !== anchor.y);
      const finalPoints = isBehind ? [...points, lastRaw] : points;
      if (finalPoints.length) {
        editorStore.getState().addStroke({ ...stroke, points: finalPoints });
      }
      clearLive();
      requestDraw();
    },

    /** Descarta el trazo (p. ej. era el inicio de un gesto con dos dedos). */
    cancel() {
      if (!active) return;
      active = null;
      clearLive();
      requestDraw();
    },
  };
};

export type StrokeSession = ReturnType<typeof createStrokeSession>;
