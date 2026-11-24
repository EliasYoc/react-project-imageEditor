/**
 * Lleva un ángulo en grados al intervalo (-180, 180]: así un giro de 350°
 * es uno de -10°, y una animación hasta 0° va por el camino corto.
 */
export const normalizeDegrees = (degrees: number) => {
  const turned = ((degrees % 360) + 360) % 360;
  return turned > 180 ? turned - 360 : turned;
};
