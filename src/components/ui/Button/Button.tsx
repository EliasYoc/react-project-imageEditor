import type { ComponentProps } from "react";
import { classNames } from "../../../lib/classNames";
import styles from "./Button.module.css";

export interface ButtonProps extends ComponentProps<"button"> {
  size?: "sm" | "md";
  /** `primary`: la acción principal de la pantalla (p. ej. Exportar). */
  variant?: "plain" | "primary" | "danger";
}

/**
 * Botón con texto. Es un <button> real: recibe foco con Tab, se activa con
 * Enter/Espacio y los lectores de pantalla lo anuncian como botón (el antiguo
 * GlobalButton era un <div> y no hacía nada de esto). Acepta `ref`, así que
 * sirve de disparador para Radix (`asChild`).
 */
export function Button({
  size = "md",
  variant = "plain",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(
        styles.button,
        styles[size],
        variant !== "plain" && styles[variant],
        className
      )}
      {...props}
    />
  );
}
