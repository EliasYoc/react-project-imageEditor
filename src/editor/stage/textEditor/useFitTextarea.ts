import { useLayoutEffect, useState, type RefObject } from "react";
import type { Size } from "../../model/types";

interface FitOptions {
  /** El texto escrito: con cada cambio se vuelve a medir. */
  draft: string;
  /** Ancho fijado con las asas laterales (null = ancho automático). */
  fixedWidth: number | null;
  fontSize: number;
  padding: number;
  /** Ancho máximo de un texto de ancho automático (`maxTextWidth`). */
  maxWidth: number;
}

/**
 * Ajusta el textarea a su texto, como Konva ajusta el del lienzo: con ancho
 * automático crece con la línea más larga hasta `maxWidth` y desde ahí se
 * reparte en líneas; el alto crece con las líneas.
 *
 * Devuelve su tamaño sin escalar y con todo el texto, aunque luego el editor
 * tenga un alto máximo: con él se decide si cabe en pantalla.
 */
export const useFitTextarea = (
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  { draft, fixedWidth, fontSize, padding, maxWidth }: FitOptions
) => {
  const [contentSize, setContentSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(
    function fitToContent() {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (fixedWidth === null) {
        // Sin saltos de línea automáticos, para medir lo que ocuparía en una.
        // Se mide sin márgenes y se suman los dos: con el contenido
        // desbordado, Chrome no cuenta el de la derecha en scrollWidth (la
        // caja de fondo salía sin margen a la derecha y el texto centrado,
        // movido).
        const inlinePadding = textarea.style.padding;
        textarea.style.whiteSpace = "";
        textarea.style.padding = "0px";
        textarea.style.width = "0px";
        const textWidth = textarea.scrollWidth;
        textarea.style.padding = inlinePadding;
        const naturalWidth = Math.max(textWidth + 2 * padding, fontSize);
        textarea.style.whiteSpace = naturalWidth > maxWidth ? "pre-wrap" : "";
        textarea.style.width = `${Math.min(naturalWidth, maxWidth)}px`;
      }
      textarea.style.height = "0px";
      textarea.style.height = `${textarea.scrollHeight}px`;
      // scrollHeight: todo el texto, aunque el editor tenga un alto máximo.
      setContentSize({
        width: textarea.offsetWidth,
        height: textarea.scrollHeight,
      });
    },
    [textareaRef, draft, fixedWidth, fontSize, padding, maxWidth]
  );

  return contentSize;
};
