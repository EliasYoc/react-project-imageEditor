import { createCanvas, get2dContext } from "../../../lib/canvas";
import type { Rgba } from "../../model/types";
import type { StampFigure, TipShape } from "./presets";
import { createRandom } from "./random";

/**
 * Punta que se guarda como imagen. La del pincel de formas lleva además la
 * figura concreta (en el preset no está: la elige el usuario en cada trazo).
 */
export type BitmapTip =
  | Exclude<TipShape, { shape: "particles" } | { shape: "stamp" }>
  | { shape: "stamp"; figure: StampFigure };

/** Puntas guardadas como máximo (cada una es un canvas pequeño). */
const MAX_CACHED_TIPS = 48;
const cache = new Map<string, HTMLCanvasElement>();

/**
 * Tamaño en píxeles con el que se genera una punta: la potencia de 2 que
 * cubre el tamaño real del sello. Se dibuja reducida (nunca ampliada), así que
 * se ve nítida también al exportar a una resolución mayor.
 */
export const tipBucket = (pixelSize: number) =>
  Math.min(1024, 2 ** Math.ceil(Math.log2(Math.max(4, pixelSize))));

const rgb = ({ r, g, b }: Rgba, alpha = 1) =>
  `rgba(${r}, ${g}, ${b}, ${alpha})`;

/** Círculo: con dureza baja el borde se difumina con una curva suave. */
const drawRound = (
  ctx: CanvasRenderingContext2D,
  size: number,
  hardness: number,
  color: Rgba
) => {
  const r = size / 2;
  if (hardness >= 0.98) {
    ctx.fillStyle = rgb(color);
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, rgb(color, 1));
  gradient.addColorStop(hardness, rgb(color, 1));
  for (let k = 1; k <= 6; k++) {
    const u = k / 6;
    // Caída tipo coseno: sin el "escalón" de un degradado lineal.
    gradient.addColorStop(
      hardness + (1 - hardness) * u,
      rgb(color, 0.5 * (1 + Math.cos(Math.PI * u)))
    );
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
};

/** Grano de papel: cada píxel conserva una parte aleatoria de su opacidad. */
const applyGrain = (
  ctx: CanvasRenderingContext2D,
  size: number,
  density: number
) => {
  const image = ctx.getImageData(0, 0, size, size);
  const { data } = image;
  // Semilla fija: la misma punta siempre tiene el mismo grano.
  const random = createRandom(9001 + size);
  for (let i = 3; i < data.length; i += 4) {
    if (!data[i]) continue;
    const keep = random() < density ? 0.55 + 0.45 * random() : 0.12 * random();
    data[i] = Math.round(data[i] * keep);
  }
  ctx.putImageData(image, 0, 0);
};

/** Rectángulo biselado (resaltador), centrado; el giro se aplica al estampar. */
const drawFlat = (
  ctx: CanvasRenderingContext2D,
  size: number,
  ratio: number,
  color: Rgba
) => {
  const height = Math.max(1, size * ratio);
  ctx.fillStyle = rgb(color);
  ctx.beginPath();
  const y = (size - height) / 2;
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(0, y, size, height, height * 0.2);
  } else {
    ctx.rect(0, y, size, height);
  }
  ctx.fill();
};

/** Polígono regular o estrella: vértices alternos a `outer` e `inner` del centro. */
const tracePolygon = (
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  vertices: number,
  outer: number,
  inner = outer
) => {
  for (let i = 0; i < vertices; i++) {
    const radius = i % 2 ? inner : outer;
    // Empieza arriba: la figura queda "de pie".
    const angle = (Math.PI * 2 * i) / vertices - Math.PI / 2;
    ctx.lineTo(
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius
    );
  }
  ctx.closePath();
};

/**
 * Figura rellena del pincel de formas, centrada. Los tamaños están ajustados
 * a ojo para que las cuatro "pesen" parecido con el mismo tamaño de pincel.
 */
const drawFigure = (
  ctx: CanvasRenderingContext2D,
  size: number,
  figure: StampFigure,
  color: Rgba
) => {
  const center = size / 2;
  ctx.fillStyle = rgb(color);
  ctx.beginPath();
  switch (figure) {
    case "circle":
      ctx.arc(center, center, center * 0.86, 0, Math.PI * 2);
      break;
    case "square": {
      const side = size * 0.76;
      ctx.rect(center - side / 2, center - side / 2, side, side);
      break;
    }
    case "triangle": {
      // Más grande que el círculo del sello y bajado un poco: así su caja
      // queda centrada y aprovecha todo el alto de la punta.
      const radius = center * 1.1;
      tracePolygon(ctx, { x: center, y: center + radius / 4 }, 3, radius);
      break;
    }
    case "star":
      tracePolygon(ctx, { x: center, y: center }, 10, center, center * 0.5);
      break;
  }
  ctx.fill();
};

const tipKey = (tip: BitmapTip, color: Rgba, bucket: number) =>
  `${JSON.stringify(tip)}|${color.r},${color.g},${color.b}|${bucket}`;

/** Punta ya coloreada, generada una vez y guardada en caché. */
export const getTip = (tip: BitmapTip, color: Rgba, bucket: number) => {
  const key = tipKey(tip, color, bucket);
  const cached = cache.get(key);
  if (cached) {
    // Al final del Map = usada hace poco (se descartan las del principio).
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const canvas = createCanvas({ width: bucket, height: bucket });
  const ctx = get2dContext(canvas);
  if (tip.shape === "flat") {
    drawFlat(ctx, bucket, tip.ratio, color);
  } else if (tip.shape === "stamp") {
    drawFigure(ctx, bucket, tip.figure, color);
  } else {
    drawRound(ctx, bucket, tip.hardness, color);
    if (tip.shape === "grain") applyGrain(ctx, bucket, tip.density);
  }

  cache.set(key, canvas);
  if (cache.size > MAX_CACHED_TIPS) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return canvas;
};
