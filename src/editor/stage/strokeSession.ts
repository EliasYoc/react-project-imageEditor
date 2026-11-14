import type { Image as KonvaImageNode } from "konva/lib/shapes/Image";
import { get2dContext } from "../../lib/canvas";
import { toStrokePoint, type PointerSample } from "../engine/pointer";
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

interface ActiveStroke {
  stroke: StrokeEntry;
  points: StrokePoint[];
  spray: SprayState;
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
 * El trazo que se está dibujando: lo muestra en el canvas del trazo en curso
 * y, al terminar, lo guarda en el store (el raster se actualiza solo).
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

  const extend = (samples: readonly PointerSample[], rect: Rect) => {
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

  return {
    /** Milisegundos desde que empezó el trazo (Infinity si no hay ninguno). */
    age: () => (active ? performance.now() - active.startedAt : Infinity),

    start(sample: PointerSample, rect: Rect) {
      const { brush } = editorStore.getState();
      const stroke = createStroke(brush.type, brush.settings[brush.type]);
      // El trazo en curso se dibuja opaco en su canvas; el modo de fusión (p.
      // ej. borrar) se aplica al mostrarlo sobre la capa de pintura.
      liveNode?.globalCompositeOperation(strokeComposite(stroke));
      active = {
        stroke,
        points: [],
        spray: createSprayState(),
        startedAt: performance.now(),
      };
      extend([sample], rect);
    },

    extend,

    finish() {
      if (!active) return;
      const { stroke, points } = active;
      active = null;
      editorStore.getState().addStroke({ ...stroke, points });
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
