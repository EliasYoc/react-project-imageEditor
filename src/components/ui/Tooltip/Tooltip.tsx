import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { HOVER_QUERY, useMediaQuery } from "../../../lib/useMediaQuery";
import styles from "./Tooltip.module.css";

/**
 * Comparte los tiempos entre tooltips: al pasar el ratón de un botón a otro
 * de la barra, el siguiente aparece sin esperar. Va una vez en la raíz.
 */
export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <RadixTooltip.Provider delayDuration={500} skipDelayDuration={300}>
    {children}
  </RadixTooltip.Provider>
);

export interface TooltipProps {
  label: string;
  /** Atajo de teclado, p. ej. "Ctrl+Z". */
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  /** Un único elemento que acepte ref y props (un botón). */
  children: ReactElement;
}

/**
 * Tooltip con el nombre del control y su atajo. Solo con ratón o trackpad:
 * en una pantalla táctil no hay hover, y el nombre ya lo lee el lector de
 * pantalla por el `aria-label`.
 */
export function Tooltip({
  label,
  shortcut,
  side = "bottom",
  children,
}: TooltipProps) {
  const canHover = useMediaQuery(HOVER_QUERY);
  if (!canHover) return children;
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          className={styles.content}
          side={side}
          sideOffset={6}
          collisionPadding={8}
        >
          {label}
          {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
