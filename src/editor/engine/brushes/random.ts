/**
 * Generador pseudoaleatorio con semilla (mulberry32).
 *
 * `Math.random()` daría manchas distintas cada vez que se repinta un trazo
 * (al deshacer, al exportar…). Con una semilla guardada en el trazo, la
 * secuencia es siempre la misma: el trazo se ve idéntico en pantalla, en el
 * raster y en la imagen exportada.
 */
export const createRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Random = ReturnType<typeof createRandom>;

/** Semilla nueva para un trazo (entero de 32 bits sin signo). */
export const createSeed = () => Math.floor(Math.random() * 2 ** 32) >>> 0;
