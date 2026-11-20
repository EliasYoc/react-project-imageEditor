import { Progress } from "radix-ui";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps {
  /** Avance de 0 a 100. */
  value: number;
  /** `id` del texto que dice qué avanza: es el nombre accesible de la barra. */
  "aria-labelledby": string;
}

/** Barra de avance, con la pista y el relleno de los sliders. */
export function ProgressBar({
  value,
  "aria-labelledby": labelledBy,
}: ProgressBarProps) {
  return (
    <Progress.Root
      className={styles.progress}
      value={value}
      aria-labelledby={labelledBy}
    >
      <Progress.Indicator
        className={styles.fill}
        style={{ width: `${value}%` }}
      />
    </Progress.Root>
  );
}
