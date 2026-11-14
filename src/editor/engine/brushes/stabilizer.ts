import type { StrokePoint } from "../../model/types";

/** Longitud máxima de la "cuerda" del estabilizador, en píxeles de PANTALLA. */
export const MAX_ROPE_SCREEN_PX = 30;

/**
 * Longitud de la cuerda en píxeles del documento. Se mide en pantalla porque
 * el temblor de la mano es de unos pocos píxeles de pantalla, sin importar el
 * zoom.
 */
export const ropeLength = (stabilizer: number, viewScale: number) =>
  (Math.min(1, Math.max(0, stabilizer)) * MAX_ROPE_SCREEN_PX) / viewScale;

/**
 * Estabilizador de "cuerda" (lazy brush): el trazo va atado al puntero con
 * una cuerda de longitud fija. Mientras el puntero se mueve dentro de la
 * cuerda, el trazo no se mueve; al tensarse, lo arrastra. Así el temblor
 * pequeño desaparece y las curvas salen suaves.
 *
 * A diferencia de una media móvil, no depende de cuántos eventos lleguen por
 * segundo (un lápiz a 240 Hz y un ratón a 60 Hz se comportan igual).
 *
 * Devuelve el nuevo punto del trazo, o null si la cuerda no se tensó.
 */
export const pullRope = (
  anchor: StrokePoint | null,
  target: StrokePoint,
  length: number
): StrokePoint | null => {
  if (!anchor) return target;
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= length || distance === 0) return null;
  const pull = (distance - length) / distance;
  return {
    x: anchor.x + dx * pull,
    y: anchor.y + dy * pull,
    pressure: target.pressure,
  };
};

/** Estabiliza una serie de puntos (incremental: devuelve el ancla nueva). */
export const stabilizePoints = (
  anchor: StrokePoint | null,
  points: readonly StrokePoint[],
  length: number
) => {
  const out: StrokePoint[] = [];
  let current = anchor;
  for (const point of points) {
    const next = pullRope(current, point, length);
    if (next) {
      out.push(next);
      current = next;
    }
  }
  return { points: out, anchor: current };
};
