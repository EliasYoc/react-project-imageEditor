import { Slider } from "radix-ui";
import { classNames } from "../../../lib/classNames";
import styles from "./VerticalSlider.module.css";

export interface VerticalSliderProps {
  /** Nombre del control (lo lee el lector de pantalla y se ve debajo). */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** El valor legible, p. ej. "24 px" o "80 %". */
  valueText: string;
  className?: string;
}

/**
 * Slider vertical para los ajustes rápidos del borde del lienzo (tamaño y
 * opacidad), como en las apps de dibujo. Arriba = más.
 *
 * Funciona con dedo, ratón y teclado (flechas, RePág/AvPág, Inicio/Fin) y
 * mientras se arrastra o tiene el foco muestra el valor en una burbuja.
 */
export function VerticalSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueText,
  className,
}: VerticalSliderProps) {
  return (
    <div className={classNames(styles.field, className)}>
      <Slider.Root
        className={styles.root}
        orientation="vertical"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
      >
        <Slider.Track className={styles.track}>
          <Slider.Range className={styles.range} />
        </Slider.Track>
        <Slider.Thumb
          className={styles.thumb}
          aria-label={label}
          aria-valuetext={valueText}
        >
          <span className={styles.bubble} aria-hidden="true">
            {valueText}
          </span>
        </Slider.Thumb>
      </Slider.Root>
      <span className={styles.caption} aria-hidden="true">
        {label}
      </span>
    </div>
  );
}
