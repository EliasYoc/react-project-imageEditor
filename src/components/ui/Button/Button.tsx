import type { ButtonHTMLAttributes } from "react";
import { classNames } from "../../../lib/classNames";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md";
}

/**
 * Botón con texto. Es un <button> real: recibe foco con Tab, se activa con
 * Enter/Espacio y los lectores de pantalla lo anuncian como botón (el antiguo
 * GlobalButton era un <div> y no hacía nada de esto).
 */
export function Button({
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(styles.button, styles[size], className)}
      {...props}
    />
  );
}
