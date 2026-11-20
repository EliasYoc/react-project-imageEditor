import { Slider } from "radix-ui";
import { classNames } from "../../../lib/classNames";
import styles from "./SliderBar.module.css";

export interface SliderBarProps {
  /** Nombre accesible: la barra no lleva texto visible. */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Se llama al soltar la barra (el dedo, el ratón o una tecla). */
  onCommit?: () => void;
  /** Valor para el lector de pantalla (p. ej. "50 %" o "0:12 de 1:30"). */
  valueText?: string;
  /**
   * Dónde va la barra y su `touch-action`: cada sitio pone los suyos. La
   * barra solo se ocupa de su aspecto (pista de 6 px y pulgar blanco).
   */
  className?: string;
}

/**
 * Barra de un slider horizontal de Radix, sin etiqueta ni valor visibles:
 * pista de 6 px, pulgar blanco y un área de 28 px de alto cómoda para el
 * dedo. Funciona con ratón, dedo y teclado. `Slider` le añade la etiqueta y
 * el valor.
 */
export function SliderBar({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onCommit,
  valueText,
  className,
}: SliderBarProps) {
  return (
    <Slider.Root
      className={classNames(styles.root, className)}
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([next]) => onChange(next)}
      onValueCommit={onCommit}
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
