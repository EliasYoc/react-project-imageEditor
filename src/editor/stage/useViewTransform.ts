import type { Layer as KonvaLayer } from "konva/lib/Layer";
import { useLayoutEffect, type RefObject } from "react";
import type { View } from "../engine/viewport";
import { viewStore } from "./viewStore";

/**
 * Pone a la capa la transformación de la vista (posición y escala) y la
 * mantiene al día fuera de React, como los trazos: el zoom y el
 * desplazamiento cambian la vista en cada frame, y así el lienzo no se
 * vuelve a renderizar en cada uno.
 *
 * Konva avisa del cambio a los nodos de la capa: el marco de selección
 * (Transformer) los sigue solo.
 */
export const useViewTransform = (layerRef: RefObject<KonvaLayer | null>) => {
  useLayoutEffect(() => {
    const apply = ({ x, y, scale }: View) => {
      const layer = layerRef.current;
      if (!layer) return;
      layer.setAttrs({ x, y, scaleX: scale, scaleY: scale });
      layer.batchDraw();
    };
    apply(viewStore.getState().view);
    return viewStore.subscribe((state, previous) => {
      if (state.view !== previous.view) apply(state.view);
    });
  }, [layerRef]);
};
