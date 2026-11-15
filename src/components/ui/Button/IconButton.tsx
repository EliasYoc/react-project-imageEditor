import type { ComponentProps, ComponentType } from "react";
import { classNames } from "../../../lib/classNames";
import { Tooltip, type TooltipProps } from "../Tooltip";
import styles from "./Button.module.css";

/** Un icono de lucide-react (o un componente SVG con las mismas props). */
export type IconComponent = ComponentType<{
  "aria-hidden"?: boolean | "true" | "false";
  className?: string;
}>;

export interface IconButtonProps extends Omit<
  ComponentProps<"button">,
  "children"
> {
  icon: IconComponent;
  /**
   * Obligatorio: el botón solo muestra un icono, así que esto es lo que lee
   * un lector de pantalla. También es el texto del tooltip (salvo `title`).
   */
  "aria-label": string;
  /** Atajo de teclado que se muestra en el tooltip, p. ej. "Ctrl+Z". */
  shortcut?: string;
  tooltipSide?: TooltipProps["side"];
}

/**
 * Botón redondo de solo icono, con el tamaño mínimo cómodo para tocar.
 *
 * Con ratón muestra un tooltip con su nombre y su atajo. Acepta `ref` y
 * cualquier prop de `<button>`, así que puede ser el disparador de un menú,
 * un panel o un selector de Radix (`asChild`).
 */
export function IconButton({
  icon: Icon,
  type = "button",
  className,
  title,
  shortcut,
  tooltipSide,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip
      label={title ?? props["aria-label"]}
      shortcut={shortcut}
      side={tooltipSide}
    >
      <button
        type={type}
        className={classNames(styles.button, styles.icon, className)}
        {...props}
      >
        <Icon aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
