import type { BrushPresetId, Rgba, StrokePoint } from "../../model/types";

/**
 * Lo que el motor necesita de un trazo. `StrokeEntry` (el trazo del
 * documento) cumple esta forma; el motor no depende del resto del modelo.
 */
export interface BrushStroke {
  brush: BrushPresetId;
  color: Rgba;
  /** Diámetro en píxeles del documento. */
  size: number;
  /** Opacidad del trazo completo (0–1). */
  opacity: number;
  /** Semilla de la variación aleatoria: el trazo se repinta siempre igual. */
  seed: number;
  /** El trazo se hizo con un lápiz que mide la presión. */
  hasPressure: boolean;
  points: StrokePoint[];
}
