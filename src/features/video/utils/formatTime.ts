/**
 * Un momento del video como "minutos:segundos" (65,4 → "1:05"). Los segundos
 * se redondean hacia abajo: hasta que no pasa un segundo entero, no cambia.
 */
export const formatTime = (seconds: number) => {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
};
