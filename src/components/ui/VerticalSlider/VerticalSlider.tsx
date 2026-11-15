import { Slider } from "radix-ui";
import { classNames } from "../../../lib/classNames";
import styles from "./VerticalSlider.module.css";

export interface VerticalSliderProps {
  /** Nombre del control para el lector de pantalla (p. ej. "Tamaño"). */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** El valor legible para el lector de pantalla, p. ej. "24 px". */
  valueText: string;
  className?: string;
}

/**
 * Slider vertical al estilo de iOS: una barra redondeada que se rellena de
 * blanco desde abajo hasta el valor (arriba = más), sin pulgar visible.
 *
 * Funciona con dedo, ratón y teclado (flechas, RePág/AvPág, Inicio/Fin) y
 * lo anuncian los lectores de pantalla (Radix): el pulgar invisible es el
 * que recibe el foco, y el foco se marca en el contorno de la barra.
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
    <Slider.Root
      className={classNames(styles.root, className)}
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
      />
    </Slider.Root>
  );
}
