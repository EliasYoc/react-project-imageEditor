import { Slider as RadixSlider } from "radix-ui";
import { classNames } from "../../../lib/classNames";
import styles from "./Slider.module.css";

export interface SliderProps {
  /** Texto visible y nombre accesible del control. */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /**
   * Valor para mostrar y para el lector de pantalla (p. ej. "50 %" o
   * "16 px"). Útil cuando `value` es una posición y no el valor real.
   */
  valueText?: string;
  className?: string;
}

/**
 * Slider horizontal de Radix: funciona con ratón, dedo y teclado (flechas,
 * Inicio/Fin, RePág/AvPág) y lo anuncian los lectores de pantalla. Radix solo
 * pone la lógica; el aspecto es el de `Slider.module.css`.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueText,
  className,
}: SliderProps) {
  return (
    <div className={classNames(styles.field, className)}>
      <span className={styles.label}>{label}</span>
      <output className={styles.value}>{valueText ?? value}</output>
      <RadixSlider.Root
        className={styles.root}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
      >
        <RadixSlider.Track className={styles.track}>
          <RadixSlider.Range className={styles.range} />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className={styles.thumb}
          aria-label={label}
          aria-valuetext={valueText}
        />
      </RadixSlider.Root>
    </div>
  );
}
