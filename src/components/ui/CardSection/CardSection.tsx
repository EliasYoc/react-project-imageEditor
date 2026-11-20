import { useId, type ReactNode } from "react";
import { classNames } from "../../../lib/classNames";
import styles from "./CardSection.module.css";

export interface CardSectionProps {
  /** Título visible; también es el nombre accesible de la sección. */
  title: string;
  /** Nivel del encabezado (`h2` o `h3`), según dónde esté la sección. */
  headingLevel: 2 | 3;
  /** Las tarjetas, que se reparten en la rejilla. */
  children: ReactNode;
  /** Color, peso y demás del título: cada pantalla pone el suyo. */
  titleClassName?: string;
  /** Columnas de la rejilla: cada pantalla pone las suyas. */
  gridClassName?: string;
}

/**
 * Sección con un título y una rejilla de tarjetas (los pinceles, los tamaños
 * de lienzo…). Solo da la estructura y el nombre accesible: las tarjetas y su
 * aspecto los pone quien la usa.
 */
export function CardSection({
  title,
  headingLevel,
  children,
  titleClassName,
  gridClassName,
}: CardSectionProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <Heading
        id={titleId}
        className={classNames(styles.title, titleClassName)}
      >
        {title}
      </Heading>
      <div className={classNames(styles.grid, gridClassName)}>{children}</div>
    </section>
  );
}
