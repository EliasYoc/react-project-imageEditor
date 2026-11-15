/** Ángulo normalizado a 0–359. */
export const normalizeAngle = (angle: number) =>
  ((Math.round(angle) % 360) + 360) % 360;

/**
 * Ángulo (como en CSS: 0° arriba, sentido horario) del vector (dx, dy) que va
 * del centro del dial al puntero. Con `snap`, se redondea a múltiplos de 15°.
 */
export const pointerAngle = (dx: number, dy: number, snap = false) => {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return normalizeAngle(snap ? Math.round(degrees / 15) * 15 : degrees);
};
