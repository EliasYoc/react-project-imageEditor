import { Blur } from "konva/lib/filters/Blur";
import type { FilterFunction, Node as KonvaNode } from "konva/lib/Node";
import { createCanvas, get2dContext } from "../../../lib/canvas";
import type { Size } from "../../model/types";

/**
 * Radio del desenfoque en proporción al lado corto de lo que se desenfoca.
 * Al ser una proporción, se ve igual en pantalla que en la imagen exportada
 * (que es más grande).
 */
export const BLUR_AMOUNT = 0.02;

/** Radio, en píxeles, con el que se desenfoca la copia reducida. */
const SMALL_RADIUS = 4;

/** Algo que desenfocar: una imagen (con su opacidad y fusión) o un color. */
export type BlurSource =
  | {
      image: CanvasImageSource;
      opacity?: number;
      blend?: GlobalCompositeOperation;
    }
  | { color: string };

export interface BlurOptions {
  amount?: number;
  /**
   * Canvas que se reutiliza para el resultado. Tiene que venir de una llamada
   * anterior a `blurLayers` (se crea preparado para leer sus píxeles).
   */
  into?: HTMLCanvasElement | null;
}

/**
 * Tamaño de la copia reducida y radio con el que se desenfoca.
 *
 * Desenfocar es caro en proporción a los píxeles, pero el resultado no tiene
 * detalle fino: se puede calcular en pequeño y ampliarlo sin que se note. La
 * copia se reduce hasta que el radio queda en `SMALL_RADIUS` píxeles, así que
 * el coste es casi el mismo en un lienzo pequeño que en una foto de 12 MP.
 */
export const blurGeometry = (size: Size, amount = BLUR_AMOUNT) => {
  const radius = Math.max(1, amount * Math.min(size.width, size.height));
  const factor = Math.max(1, radius / SMALL_RADIUS);
  return {
    width: Math.max(1, Math.round(size.width / factor)),
    height: Math.max(1, Math.round(size.height / factor)),
    radius: Math.max(1, Math.round(radius / factor)),
  };
};

const drawSources = (
  ctx: CanvasRenderingContext2D,
  sources: readonly BlurSource[],
  width: number,
  height: number
) => {
  for (const source of sources) {
    ctx.save();
    if ("color" in source) {
      ctx.fillStyle = source.color;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.globalAlpha = source.opacity ?? 1;
      ctx.globalCompositeOperation = source.blend ?? "source-over";
      ctx.drawImage(source.image, 0, 0, width, height);
    }
    ctx.restore();
  }
};

/**
 * Copia reducida y desenfocada de `sources` (compuestas en orden), que miden
 * `size`. Para usarla se dibuja ampliada a ese tamaño (`revealBlurred`).
 *
 * El desenfoque es el filtro `Blur` de Konva (un "stack blur", casi gaussiano
 * y con la transparencia bien resuelta) aplicado a la copia reducida. No se
 * usa `ctx.filter = "blur()"`: no todos los navegadores lo tienen.
 */
export const blurLayers = (
  sources: readonly BlurSource[],
  size: Size,
  { amount = BLUR_AMOUNT, into }: BlurOptions = {}
) => {
  const { width, height, radius } = blurGeometry(size, amount);
  const out = into ?? createCanvas({ width, height });
  if (out.width !== width || out.height !== height) {
    out.width = width;
    out.height = height;
  }
  // Se leen sus píxeles en cada uso: mejor en memoria que en la GPU.
  const ctx = out.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("El navegador no pudo crear un contexto 2D");

  const prepare = (canvas: HTMLCanvasElement) => {
    const target = canvas === out ? ctx : get2dContext(canvas);
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.globalAlpha = 1;
    target.globalCompositeOperation = "source-over";
    // Suavizado normal, no "high": al reducir a la mitad ya promedia cada
    // 2 × 2 píxeles, y "high" obliga al navegador a preparar la imagen
    // entera a varios tamaños (medido: 25 ms en vez de 4 en 2048 × 2048).
    target.imageSmoothingEnabled = true;
    target.imageSmoothingQuality = "low";
    target.clearRect(0, 0, canvas.width, canvas.height);
    return target;
  };

  // Se reduce por mitades: de golpe, los detalles finos dejarían "dientes".
  const temps: HTMLCanvasElement[] = [];
  const stepCanvas = (w: number, h: number) => {
    if (w === width && h === height) return out;
    const temp = createCanvas({ width: w, height: h });
    temps.push(temp);
    return temp;
  };
  const halve = (value: number, min: number) =>
    Math.max(min, Math.ceil(value / 2));

  let w = halve(size.width, width);
  let h = halve(size.height, height);
  let current = stepCanvas(w, h);
  drawSources(prepare(current), sources, w, h);
  while (current !== out) {
    w = halve(w, width);
    h = halve(h, height);
    const next = stepCanvas(w, h);
    prepare(next).drawImage(current, 0, 0, w, h);
    current = next;
  }

  const pixels = ctx.getImageData(0, 0, width, height);
  // El filtro de Konva es una función sobre los píxeles que lee el radio del
  // nodo al que se aplica: aquí no hay nodo, solo ese dato.
  (Blur as FilterFunction).call(
    { blurRadius: () => radius } as unknown as KonvaNode,
    pixels
  );
  ctx.putImageData(pixels, 0, 0);

  // Los intermedios pueden ser grandes al exportar: se sueltan ya.
  for (const temp of temps) {
    temp.width = 0;
    temp.height = 0;
  }
  return out;
};

/**
 * Deja en `ctx` la copia desenfocada SOLO donde ya había algo pintado (la
 * máscara): cada píxel conserva su opacidad y cambia su color por el de la
 * copia, ampliada al tamaño del canvas.
 */
export const revealBlurred = (
  ctx: CanvasRenderingContext2D,
  blurred: CanvasImageSource
) => {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-in";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(blurred, 0, 0, width, height);
  ctx.restore();
};
