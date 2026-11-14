/** Posiciones del slider (más que tamaños: así el movimiento es continuo). */
export const SLIDER_STEPS = 1000;

interface Range {
  min: number;
  max: number;
}

/**
 * Escala cuadrática para el tamaño del pincel: la mitad del slider cubre los
 * tamaños pequeños (1–50 de 200), donde una diferencia de pocos píxeles se
 * nota mucho (pluma, lápiz). Con una escala lineal, el 1–10 ocuparía un 5 %.
 */
export const sliderToSize = (position: number, { min, max }: Range) =>
  Math.round(min + (max - min) * (position / SLIDER_STEPS) ** 2);

export const sizeToSlider = (size: number, { min, max }: Range) =>
  Math.round(
    SLIDER_STEPS *
      Math.sqrt(Math.min(1, Math.max(0, (size - min) / (max - min))))
  );
