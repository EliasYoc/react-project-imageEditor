/*
 * Qué fotograma se ve en cada momento: de un GIF (`frameIndexAt`) y de un
 * sticker Lottie (`lottieFrameAt`). Las animaciones se repiten sin fin.
 */

/** Cuándo se ve cada fotograma de una imagen animada (un GIF). */
export interface AnimationTimeline {
  /** Inicio de cada fotograma, en segundos desde el principio de la vuelta. */
  frameStarts: readonly number[];
  /** Lo que dura una vuelta entera, en segundos. */
  loopDuration: number;
}

/**
 * Los fotogramas de 10 ms o menos (o sin duración) se muestran 100 ms, como
 * hacen los navegadores con un GIF en `<img>`: muchos GIFs antiguos guardan
 * una duración de 0 y, a la velocidad real, irían a toda prisa.
 */
const MAX_TOO_SHORT_SECONDS = 0.01;
const FALLBACK_FRAME_SECONDS = 0.1;

/**
 * Margen al comparar tiempos (y fotogramas). Con decimales, `0,6 % 0,4` da
 * 0,1999… en vez de 0,2, y `1,2 % 0,4` da 0,3999… en vez de 0: justo en un
 * cambio de fotograma (o de vuelta) saldría el anterior.
 */
const ROUNDING_EPSILON = 1e-9;

/**
 * Dónde cae `value` dentro de una vuelta de largo `loop` (de 0 a `loop`). Un
 * valor negativo también cae en la vuelta, y justo al final de una vuelta ya
 * empieza la siguiente: lo que falta para llegar es solo redondeo.
 */
const positionInLoop = (value: number, loop: number) => {
  // La vuelta se suma solo a un negativo: `(t % d + d) % d` redondea mal
  // (0,1 en 0,6 daría 0,0999…).
  let position = value % loop;
  if (position < 0) position += loop;
  return loop - position <= ROUNDING_EPSILON ? 0 : position;
};

/**
 * Lo que se muestra un fotograma, en segundos, a partir de la duración que
 * da `ImageDecoder` (en microsegundos, o null si el archivo no la indica).
 */
export const frameSeconds = (durationMicroseconds: number | null) => {
  const seconds = (durationMicroseconds ?? 0) / 1_000_000;
  return seconds <= MAX_TOO_SHORT_SECONDS ? FALLBACK_FRAME_SECONDS : seconds;
};

/** La línea de tiempo de una vuelta, a partir de lo que dura cada fotograma. */
export const buildTimeline = (
  frameDurations: readonly number[]
): AnimationTimeline => {
  const frameStarts: number[] = [];
  let loopDuration = 0;
  for (const duration of frameDurations) {
    frameStarts.push(loopDuration);
    loopDuration += duration;
  }
  return { frameStarts, loopDuration };
};

/**
 * El fotograma que se ve en el segundo `seconds`. La animación se repite sin
 * fin: el segundo 0 de cada vuelta es el primer fotograma.
 */
export const frameIndexAt = (
  { frameStarts, loopDuration }: AnimationTimeline,
  seconds: number
) => {
  if (frameStarts.length <= 1 || loopDuration <= 0) return 0;
  const time = positionInLoop(seconds, loopDuration);
  // Búsqueda binaria del último fotograma que empieza antes de `time`.
  let low = 0;
  let high = frameStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (frameStarts[middle] <= time + ROUNDING_EPSILON) low = middle;
    else high = middle - 1;
  }
  return low;
};

/** El tiempo de un sticker Lottie, como lo guarda su archivo. */
export interface LottieTiming {
  /** Fotogramas por segundo. */
  fr: number;
  /** Primer fotograma de la animación. */
  ip: number;
  /** Fotograma en el que termina (ya no se ve). */
  op: number;
}

/**
 * El fotograma de un sticker Lottie en el segundo `seconds`, contado desde
 * su primer fotograma (`ip`), como lo pide `goToAndStop` de lottie-web. Puede
 * llevar decimales: lottie-web pinta también los intermedios.
 */
export const lottieFrameAt = (
  { fr, ip, op }: LottieTiming,
  seconds: number
) => {
  const frameCount = op - ip;
  if (frameCount <= 0) return 0;
  const frame = positionInLoop(seconds * fr, frameCount);
  // Un fotograma entero que el redondeo dejó en 5,9999… se queda en 6: en
  // 5,9999 aún se vería lo del fotograma 5.
  const whole = Math.round(frame);
  return Math.abs(frame - whole) <= ROUNDING_EPSILON ? whole : frame;
};

/**
 * Cuántos pasos enteros de `1 / stepsPerSecond` caben en `seconds` (p. ej.
 * el fotograma de pantalla a 30 por segundo), sin que el redondeo deje el
 * paso 6 en 5,9999….
 */
export const wholeStepsIn = (seconds: number, stepsPerSecond: number) =>
  Math.floor(seconds * stepsPerSecond + ROUNDING_EPSILON);
