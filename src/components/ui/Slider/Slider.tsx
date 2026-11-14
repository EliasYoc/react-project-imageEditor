import { useId, type CSSProperties } from "react";
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
 * Slider horizontal sobre un `<input type="range">` nativo: funciona con
 * ratón, dedo y teclado (flechas, Inicio/Fin, RePág/AvPág) y lo anuncian los
 * lectores de pantalla sin código extra. Se sustituye por Radix en la Fase 6.
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
  const id = useId();
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={classNames(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <output htmlFor={id} className={styles.value}>
        {valueText ?? value}
      </output>
      <input
        id={id}
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        // La parte rellena de la pista (el navegador no la pinta igual en todos).
        style={{ "--fill": `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
