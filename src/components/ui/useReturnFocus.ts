import { useRef } from "react";

/**
 * Devuelve el foco a donde estaba al abrir un diálogo, cuando se cierra.
 *
 * Radix lo hace solo si el diálogo se abre con su `Trigger`; aquí los paneles
 * y diálogos se abren desde botones normales (el estado vive fuera), así que
 * se guarda el elemento con foco al abrir y se le devuelve al cerrar. Si ya
 * no está en la página (p. ej. una opción de un menú que se cerró), el foco
 * se queda donde lo deje el navegador.
 */
export const useReturnFocus = () => {
  const previousRef = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      previousRef.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      const previous = previousRef.current;
      previousRef.current = null;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    },
  };
};
