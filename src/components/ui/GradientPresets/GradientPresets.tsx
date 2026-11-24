import type { CSSProperties } from "react";
import type { GradientPreset } from "../../../editor/engine/fill/presets";
import type { Gradient } from "../../../editor/model/types";
import styles from "./GradientPresets.module.css";

export interface GradientPresetsProps {
  presets: readonly GradientPreset[];
  /** Cómo se pinta cada degradado en su casilla (el fondo y el texto lo hacen distinto). */
  toCss: (gradient: Gradient) => string;
  /** Ancho mínimo de cada casilla, en px: decide cuántas caben por fila. */
  minSize: number;
  onSelect: (gradient: Gradient) => void;
}

/** Rejilla de degradados predefinidos: cada casilla aplica el suyo al pulsarla. */
export function GradientPresets({
  presets,
  toCss,
  minSize,
  onSelect,
}: GradientPresetsProps) {
  return (
    <div
      className={styles.presets}
      style={{ "--preset-min-size": `${minSize}px` } as CSSProperties}
      role="group"
      aria-label="Degradados"
    >
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={styles.preset}
          style={{ backgroundImage: toCss(preset.gradient) }}
          aria-label={preset.label}
          title={preset.label}
          onClick={() => onSelect(preset.gradient)}
        />
      ))}
    </div>
  );
}
