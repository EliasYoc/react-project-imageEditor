import type { ReactNode } from "react";
import styles from "./ToggleSection.module.css";

export interface ToggleSectionProps {
  /** Título visible; también es el nombre de la casilla y de la sección. */
  title: string;
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
  /** Lo que se muestra mientras la sección está activada. */
  children: ReactNode;
}

/** Sección que se activa con una casilla (contorno, sombra, caja de fondo). */
export const ToggleSection = ({
  title,
  isEnabled,
  onToggle,
  children,
}: ToggleSectionProps) => (
  <section className={styles.section} aria-label={title}>
    <label className={styles.sectionHeader}>
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={(event) => onToggle(event.target.checked)}
      />
      {title}
    </label>
    {isEnabled && <div className={styles.sectionBody}>{children}</div>}
  </section>
);
