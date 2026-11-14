import type { ButtonHTMLAttributes } from "react";
import type { IconType } from "react-icons";
import { classNames } from "../../../lib/classNames";
import styles from "./Button.module.css";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  icon: IconType;
  /**
   * Obligatorio: el botón solo muestra un icono, así que esto es lo que lee
   * un lector de pantalla. También se usa como tooltip (title).
   */
  "aria-label": string;
}

/** Botón redondo de solo icono, con el tamaño mínimo cómodo para tocar. */
export function IconButton({
  icon: Icon,
  type = "button",
  className,
  title,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={title ?? props["aria-label"]}
      className={classNames(styles.button, styles.icon, className)}
      {...props}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
