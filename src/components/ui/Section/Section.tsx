import { useId, type ReactNode } from "react";
import { classNames } from "../../../lib/classNames";
import styles from "./Section.module.css";

export interface SectionProps {
  /** Título visible; también es el nombre accesible de la sección. */
  title: string;
  /**
   * `strong`: título más marcado (diálogos y «Estilo» del texto).
   * `subtle`: título más suave, dentro de las hojas de ajustes.
   */
  variant?: "strong" | "subtle";
  /** Para la disposición de la sección (columnas, separación…): la pone quien la usa. */
  className?: string;
  children: ReactNode;
}

/** Sección con un título `h3`, que es también su nombre accesible. */
export function Section({
  title,
  variant = "strong",
  className,
  children,
}: SectionProps) {
  const titleId = useId();

  return (
    <section className={className} aria-labelledby={titleId}>
      <h3 id={titleId} className={classNames(styles.title, styles[variant])}>
        {title}
      </h3>
      {children}
    </section>
  );
}
