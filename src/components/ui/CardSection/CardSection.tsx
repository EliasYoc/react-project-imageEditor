import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { classNames } from "../../../lib/classNames";
import styles from "./CardSection.module.css";

export interface CardSectionProps {
  /** Título visible; también es el nombre accesible de la sección. */
  title: string;
  /** Icono opcional a la izquierda del título (decorativo: el título ya dice lo mismo). */
  icon?: LucideIcon;
  /** Nivel del encabezado (`h2` o `h3`), según dónde esté la sección. */
  headingLevel: 2 | 3;
  /** Las tarjetas, que se reparten en la rejilla. */
  children: ReactNode;
  /** Columnas de la rejilla: cada pantalla pone las suyas. */
  gridClassName?: string;
}

/**
 * Sección con un título y una rejilla de tarjetas (los pinceles, los tamaños
 * de lienzo…). Pone el título, la rejilla y el nombre accesible: las tarjetas
 * y sus columnas las pone quien la usa.
 */
export function CardSection({
  title,
  icon: Icon,
  headingLevel,
  children,
  gridClassName,
}: CardSectionProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <Heading
        id={titleId}
        className={classNames(styles.title, Icon && styles.hasIcon)}
      >
        {Icon && <Icon aria-hidden="true" className={styles.icon} />}
        {title}
      </Heading>
      <div className={classNames(styles.grid, gridClassName)}>{children}</div>
    </section>
  );
}
