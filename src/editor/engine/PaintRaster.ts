import { createCanvas, get2dContext } from "../../lib/canvas";
import type { Size, StrokeEntry } from "../model/types";
import { paintStroke } from "./brushes/paint";

export type CanvasFactory = (size: Size) => HTMLCanvasElement;

interface Checkpoint {
  /** Cuántos trazos contiene la copia. */
  count: number;
  /** Id del último trazo incluido: sirve para saber si sigue siendo válida. */
  lastId: string;
  readonly canvas: HTMLCanvasElement;
  lastUsed: number;
}

export interface PaintRasterOptions {
  createCanvas?: CanvasFactory;
  paint?: (
    ctx: CanvasRenderingContext2D,
    stroke: StrokeEntry,
    scratch: HTMLCanvasElement | null
  ) => void;
  /** Cada cuántos trazos se guarda una copia del raster. */
  checkpointInterval?: number;
  /** Copias como máximo (cada una ocupa ancho × alto × 4 bytes). */
  maxCheckpoints?: number;
}

/** Qué tuvo que hacer `sync` (útil en los tests y para depurar). */
export type SyncResult = "unchanged" | "appended" | "restored" | "redrawn";

/**
 * Capa de pintura en un canvas fuera de pantalla, con el tamaño del documento.
 *
 * Es una CACHÉ de los trazos del store: `sync(trazos)` la pone al día haciendo
 * el mínimo trabajo posible.
 * - Si solo hay trazos nuevos al final, pinta solo esos.
 * - Si se deshizo algo, vuelve a la copia guardada (checkpoint) más cercana y
 *   pinta desde ahí, en vez de repintar todo el historial.
 */
export class PaintRaster {
  readonly canvas: HTMLCanvasElement;
  private readonly createCanvas: CanvasFactory;
  private readonly paint: NonNullable<PaintRasterOptions["paint"]>;
  private readonly checkpointInterval: number;
  private readonly maxCheckpoints: number;
  /** Trazos que hay pintados ahora mismo en `canvas`, en orden. */
  private rendered: StrokeEntry[] = [];
  private checkpoints: Checkpoint[] = [];
  private clock = 0;
  /** Búfer del trazo (para la opacidad y el modo de fusión); se crea al usarse. */
  private scratch: HTMLCanvasElement | null = null;

  constructor(size: Size, options: PaintRasterOptions = {}) {
    this.createCanvas = options.createCanvas ?? createCanvas;
    this.paint = options.paint ?? paintStroke;
    this.checkpointInterval = options.checkpointInterval ?? 20;
    this.maxCheckpoints = options.maxCheckpoints ?? 4;
    this.canvas = this.createCanvas(size);
  }

  get size(): Size {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  sync(strokes: readonly StrokeEntry[]): SyncResult {
    let common = 0;
    const max = Math.min(this.rendered.length, strokes.length);
    while (common < max && this.rendered[common].id === strokes[common].id) {
      common++;
    }

    const canContinue = common === this.rendered.length;
    if (canContinue && common === strokes.length) return "unchanged";

    // Punto de partida: el estado actual (si no hay que quitar nada) o la
    // copia válida que contenga más trazos.
    let start = canContinue ? common : 0;
    let checkpoint: Checkpoint | null = null;
    for (const candidate of this.checkpoints) {
      if (
        candidate.count > start &&
        candidate.count <= strokes.length &&
        strokes[candidate.count - 1].id === candidate.lastId
      ) {
        checkpoint = candidate;
        start = candidate.count;
      }
    }

    const ctx = get2dContext(this.canvas);
    let result: SyncResult = "appended";
    if (checkpoint) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(checkpoint.canvas, 0, 0);
      checkpoint.lastUsed = ++this.clock;
      result = "restored";
    } else if (!canContinue) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      result = "redrawn";
    }

    this.rendered = strokes.slice(0, start);
    for (let i = start; i < strokes.length; i++) {
      this.paint(ctx, strokes[i], this.getScratch());
      this.rendered.push(strokes[i]);
      if (this.rendered.length % this.checkpointInterval === 0) {
        this.saveCheckpoint();
      }
    }
    return result;
  }

  private getScratch() {
    this.scratch ??= this.createCanvas(this.size);
    return this.scratch;
  }

  private saveCheckpoint() {
    const count = this.rendered.length;
    const lastId = this.rendered[count - 1].id;
    if (
      this.checkpoints.some((c) => c.count === count && c.lastId === lastId)
    ) {
      return;
    }
    const copy = this.createCanvas(this.size);
    copy.getContext("2d")?.drawImage(this.canvas, 0, 0);
    this.checkpoints.push({
      count,
      lastId,
      canvas: copy,
      lastUsed: ++this.clock,
    });
    if (this.checkpoints.length > this.maxCheckpoints) {
      // Se descarta la copia que lleva más tiempo sin usarse.
      const oldest = this.checkpoints.reduce((a, b) =>
        a.lastUsed <= b.lastUsed ? a : b
      );
      this.checkpoints = this.checkpoints.filter((c) => c !== oldest);
    }
  }

  /** Copias guardadas (solo para los tests). */
  get checkpointCounts() {
    return this.checkpoints.map((c) => c.count).sort((a, b) => a - b);
  }
}
