import { useEffectEvent, useLayoutEffect, type RefObject } from "react";

/**
 * Llama a `onResize` cuando cambia el tamaño del elemento.
 *
 * Se observa desde que el elemento se monta hasta que se desmonta, con un
 * solo observador: `onResize` puede cambiar en cada render sin volver a
 * crearlo, y siempre se llama a la última versión.
 */
export const useResizeObserver = (
  ref: RefObject<Element | null>,
  onResize: (entry: ResizeObserverEntry) => void
) => {
  const handleResize = useEffectEvent(onResize);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => handleResize(entry));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
};
