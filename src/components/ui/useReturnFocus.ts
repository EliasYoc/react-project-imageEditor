import { useRef } from "react";

/**
 * Devuelve el foco a donde estaba al abrir un diálogo, cuando se cierra.
 *
 * Radix lo hace solo si el diálogo se abre con su `Trigger`; aquí los paneles
 * y diálogos se abren desde botones normales (el estado vive fuera), así que
 * se guarda el elemento con foco al abrir y se le devuelve al cerrar. Si ya
 * no está en la página (p. ej. una opción de un menú que se cerró), el foco
 * se queda donde lo deje el navegador.
 *
 * Radix lo pide al terminar la animación de salida. Si mientras tanto el
 * usuario ya puso el foco en otro control (p. ej. abrió el selector de color
 * justo después de cerrar los pinceles), no se le quita: si no, ese control
 * perdería el foco y se cerraría.
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
      // El evento llega desde el contenido que se cierra.
      const closing = event.target instanceof Node ? event.target : null;
      const active = document.activeElement;
      const focusMovedOn =
        active !== null &&
        active !== document.body &&
        !closing?.contains(active);
      if (focusMovedOn) return;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    },
  };
};
