import { classNames } from "../../../lib/classNames";
import { SliderBar } from "../SliderBar";
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
 * Slider horizontal con etiqueta y valor encima de su barra (`SliderBar`, de
 * Radix): funciona con ratón, dedo y teclado (flechas, Inicio/Fin,
 * RePág/AvPág) y lo anuncian los lectores de pantalla.
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
      <SliderBar
        className={styles.bar}
        label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        valueText={valueText}
        onChange={onChange}
      />
    </div>
  );
}
