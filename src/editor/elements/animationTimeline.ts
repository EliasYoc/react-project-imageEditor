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
 * Margen al comparar tiempos: con decimales, `0,6 % 0,4` da 0,1999… en vez de
 * 0,2 y, justo en el cambio de fotograma, saldría el anterior.
 */
const TIME_EPSILON = 1e-9;

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
  // Un tiempo negativo también cae en la vuelta. La vuelta se suma solo
  // entonces: `(t % d + d) % d` redondea mal (0,1 en 0,6 daría 0,0999…).
  let time = seconds % loopDuration;
  if (time < 0) time += loopDuration;
  // Búsqueda binaria del último fotograma que empieza antes de `time`.
  let low = 0;
  let high = frameStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (frameStarts[middle] <= time + TIME_EPSILON) low = middle;
    else high = middle - 1;
  }
  return low;
};
