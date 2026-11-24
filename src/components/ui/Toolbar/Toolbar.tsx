import { Toolbar as RadixToolbar } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

export interface ToolbarProps {
  /** Nombre de la barra para el lector de pantalla (p. ej. "Herramientas de dibujo"). */
  label: string;
  /** Para el aspecto de la barra: lo pone quien la usa. */
  className?: string;
  children: ReactNode;
}

/**
 * Barra de herramientas accesible. Tab entra en ella una sola vez (en el
 * último botón que tuvo el foco) y las flechas izquierda y derecha pasan de
 * un botón a otro; Inicio y Fin van al primero y al último. Así recorrerla no
 * cuesta una pulsación de Tab por botón.
 *
 * Solo los botones envueltos en `ToolbarButton` entran en ese recorrido: el
 * resto de lo que haya dentro (un slider, un texto) sigue su propio camino.
 */
export function Toolbar({ label, className, children }: ToolbarProps) {
  return (
    <RadixToolbar.Root aria-label={label} className={className}>
      {children}
    </RadixToolbar.Root>
  );
}

/**
 * Hace que su único hijo (un `IconButton`, un `Button`, el botón de un menú…)
 * sea una parada del recorrido con flechas de la `Toolbar` que lo contiene.
 * Pasa al hijo el `ref` y las props, así que también sirve de disparador de
 * un menú o un selector de Radix (`asChild`).
 */
export function ToolbarButton(
  props: ComponentProps<typeof RadixToolbar.Button>
) {
  return <RadixToolbar.Button asChild {...props} />;
}
