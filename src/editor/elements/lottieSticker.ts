import type { AnimationConfigWithData } from "lottie-web";
import lottie from "lottie-web/build/player/lottie_light_canvas";
import { createCanvas, get2dContext } from "../../lib/canvas";
import type { AnimatedImage, AnimationReader } from "./animatedImage";
import { lottieFrameAt, wholeStepsIn } from "./animationTimeline";
import { readLottieFile, type LottieData } from "./lottieFile";
import { stickerResolution } from "./stickerResolution";

/*
 * Stickers Lottie (.json, o .tgs de Telegram) con lottie-web.
 *
 * Se usa su versión "light" para canvas: no ejecuta las expresiones de After
 * Effects (lo hace con `eval`), así que un archivo malicioso no puede
 * ejecutar código en la página. Este módulo, y con él lottie-web (unos
 * 55 kB), se descarga con el primer sticker.
 */

/**
 * En pantalla, como mucho 30 fotogramas por segundo: un sticker de 60 fps
 * cuesta así la mitad, y con muchos se nota. Al exportar se usa el tiempo
 * exacto de cada fotograma.
 */
const SCREEN_FRAME_RATE = 30;

/**
 * Los datos de cada sticker, leídos una vez por `src`. Ya se comprobaron al
 * insertarlo; si ahora fallan, el archivo cambió y el error se ve.
 */
const dataBySrc = new Map<string, Promise<LottieData>>();

const loadLottieData = (src: string) => {
  const cached = dataBySrc.get(src);
  if (cached) return cached;
  const data = fetch(src)
    .then((response) => response.blob())
    .then(readLottieFile)
    .then((result) => {
      if (!result.isValid) throw new Error(result.message);
      return result.data;
    });
  // Un fallo no se guarda: la próxima vez se vuelve a intentar.
  data.catch(() => dataBySrc.delete(src));
  dataBySrc.set(src, data);
  return data;
};

/** Ancho y alto de un canvas de lado mayor `side`, con la forma del sticker. */
const canvasSizeFor = ({ w, h }: LottieData, side: number) =>
  w >= h
    ? { width: side, height: Math.max(1, Math.round((side * h) / w)) }
    : { width: Math.max(1, Math.round((side * w) / h)), height: side };

/**
 * Un sticker que lottie-web dibuja en un canvas propio, de lado mayor `side`.
 * Espera a que esté listo: las imágenes incrustadas cargan aparte.
 */
const createLottieCanvas = async (data: LottieData, side: number) => {
  const canvas = createCanvas(canvasSizeFor(data, side));
  // Sin `container`, el renderizador de canvas pinta en
  // `rendererSettings.context`. Los tipos de lottie-web piden siempre un
  // contenedor, aunque su código no lo usa en este caso.
  const config = {
    renderer: "canvas",
    loop: false,
    autoplay: false,
    // Cada reproductor con su copia: lottie-web modifica los datos que lee.
    animationData: structuredClone(data),
    rendererSettings: {
      context: get2dContext(canvas),
      clearCanvas: true,
      // El canvas ya mide lo que se quiere: sin multiplicar por la pantalla.
      dpr: 1,
    },
  } as unknown as AnimationConfigWithData<"canvas">;
  const animation = lottie.loadAnimation(config);
  if (!animation.isLoaded) {
    await new Promise<void>((resolve, reject) => {
      animation.addEventListener("DOMLoaded", () => resolve());
      animation.addEventListener("data_failed", () =>
        reject(new Error("lottie-web no pudo preparar el sticker"))
      );
    });
  }
  return {
    canvas,
    /** Pinta el fotograma del segundo `seconds`, en el momento. */
    drawAt: (seconds: number) =>
      animation.goToAndStop(lottieFrameAt(data, seconds), true),
    /** Cambia el lado mayor del canvas (después hay que volver a pintar). */
    resize: (newSide: number) => {
      const { width, height } = canvasSizeFor(data, newSide);
      animation.resize(width, height);
    },
    destroy: () => animation.destroy(),
  };
};

/**
 * Tiempo máximo, por frame de pantalla, para pintar stickers.
 *
 * Cada sticker distinto se pinta aparte. Con 9 distintos en un teléfono
 * lento (medido con la CPU 4 veces más lenta), pintarlos todos de golpe
 * hacía frames de 100 ms: la app se notaba trabada al tocar o arrastrar. Se
 * pintan por turnos: los que no caben en este frame esperan al siguiente.
 * Sus animaciones van entonces más despacio, pero la app sigue fluida.
 */
const FRAME_BUDGET_MS = 8;

/** Los stickers con un fotograma nuevo por pintar, en orden de llegada. */
const waitingToPaint = new Set<() => void>();
let isPaintScheduled = false;

const paintWaiting = () => {
  isPaintScheduled = false;
  const start = performance.now();
  // Al menos uno por frame, aunque tarde más: así todos avanzan.
  for (const paint of waitingToPaint) {
    waitingToPaint.delete(paint);
    paint();
    if (performance.now() - start >= FRAME_BUDGET_MS) break;
  }
  if (waitingToPaint.size > 0) schedulePaint();
};

const schedulePaint = () => {
  if (isPaintScheduled) return;
  isPaintScheduled = true;
  requestAnimationFrame(paintWaiting);
};

/** Pide pintar un sticker en su turno (si ya esperaba, conserva su sitio). */
const requestPaint = (paint: () => void) => {
  waitingToPaint.add(paint);
  schedulePaint();
};

/**
 * Un sticker del lienzo, compartido por todos los elementos con el mismo
 * archivo: se pinta una vez por fotograma de pantalla, aunque haya 30
 * copias, y a la mayor resolución con que se vea alguna de ellas.
 */
export const openLottieSticker = async (
  src: string
): Promise<AnimatedImage> => {
  const data = await loadLottieData(src);
  // Pequeño hasta que algún elemento diga cómo se ve (lo hace enseguida).
  let side = stickerResolution(0);
  const player = await createLottieCanvas(data, side);
  const listeners = new Set<() => void>();
  /** La resolución que pide cada elemento que lo muestra. */
  const requested = new Map<symbol, number>();
  /** El fotograma de pantalla que toca (null: aún ninguno). */
  let wantedStep: number | null = null;
  /** El que está pintado en el canvas. */
  let shownStep: number | null = null;

  const draw = (step: number) => {
    shownStep = step;
    player.drawAt(step / SCREEN_FRAME_RATE);
    for (const listener of listeners) listener();
  };
  // En su turno pinta el último fotograma pedido (los de en medio, no).
  const paintWanted = () => {
    if (wantedStep !== null && wantedStep !== shownStep) draw(wantedStep);
  };

  const updateResolution = () => {
    // Sin pedidos (todos los elementos se quitaron) se queda como está.
    if (requested.size === 0) return;
    const wanted = Math.max(...requested.values());
    if (wanted === side) return;
    side = wanted;
    // Cambiar el tamaño borra el canvas: se repinta ya, sin esperar turno,
    // para que no se vea vacío (pasa poco: al cambiar de escalón el zoom).
    player.resize(side);
    if (shownStep !== null) draw(shownStep);
  };

  return {
    canvas: player.canvas,
    showFrameAt: (seconds) => {
      const step = wholeStepsIn(seconds, SCREEN_FRAME_RATE);
      if (step === wantedStep) return;
      wantedStep = step;
      requestPaint(paintWanted);
    },
    onFrame: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    showAtSize: (pixels) => {
      const key = Symbol("elemento");
      requested.set(key, stickerResolution(pixels));
      updateResolution();
      return () => {
        requested.delete(key);
        updateResolution();
      };
    },
  };
};

/**
 * Un sticker para exportar, aparte del del lienzo: con su propio canvas de
 * lado mayor `side` (el tamaño con que sale en el archivo; al ser vectorial,
 * sale nítido) y pintado en el momento exacto de cada fotograma, sin turnos.
 */
export const openLottieReader = async (
  src: string,
  side: number
): Promise<AnimationReader> => {
  const data = await loadLottieData(src);
  const player = await createLottieCanvas(data, Math.max(1, Math.round(side)));
  return {
    canvas: player.canvas,
    drawFrameAt: async (seconds) => player.drawAt(seconds),
    close: player.destroy,
  };
};
