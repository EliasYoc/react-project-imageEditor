import { Layer } from "konva/lib/Layer";
import { Stage } from "konva/lib/Stage";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { createTextLabel } from "../../../editor/elements/textShape";
import type { TextElement } from "../../../editor/model/types";
import {
  useFontReady,
  useMaxTextWidth,
} from "../../../editor/stage/elementHooks";
import { useResizeObserver } from "../../../hooks/useResizeObserver";
import { PREVIEW_HEIGHT, PREVIEW_PADDING } from "../constants/textPreview";
import { previewLayout, previewText, textBleed } from "../utils/textPreview";

/**
 * Pinta `text` en un Stage de Konva propio dentro de `hostRef`, ajustado a su
 * ancho. Lo vuelve a pintar cuando cambia el texto, cuando llega su fuente y
 * cuando cambia el ancho del panel.
 */
export const useTextPreview = (
  hostRef: RefObject<HTMLDivElement | null>,
  text: TextElement
) => {
  const sceneRef = useRef<{ stage: Stage; layer: Layer } | null>(null);
  const isFontReady = useFontReady(text.fontId, text.fontWeight);
  // El mismo tope de ancho que en el lienzo: se reparte en las mismas líneas.
  const maxWidth = useMaxTextWidth();

  useLayoutEffect(
    function createScene() {
      const host = hostRef.current;
      if (!host) return;
      const stage = new Stage({
        container: host,
        width: host.clientWidth,
        height: PREVIEW_HEIGHT,
      });
      // Sin eventos: es solo para mirar.
      const layer = new Layer({ listening: false });
      stage.add(layer);
      sceneRef.current = { stage, layer };
      return () => {
        stage.destroy();
        sceneRef.current = null;
      };
    },
    [hostRef]
  );

  const draw = useCallback(() => {
    const host = hostRef.current;
    const scene = sceneRef.current;
    // Sin la fuente lista, Konva mediría con la de reserva: se queda lo que
    // había hasta que llegue.
    if (!host || !scene || !isFontReady) return;
    const area = { width: host.clientWidth, height: PREVIEW_HEIGHT };
    if (area.width <= 2 * PREVIEW_PADDING) return;

    const { stage, layer } = scene;
    // Sin posición, giro ni escala propios: solo importa el estilo.
    const { label, text: node } = createTextLabel(
      {
        ...text,
        text: previewText(text.text),
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
      },
      maxWidth
    );
    const { scale, x, y } = previewLayout(
      { width: node.width(), height: node.height() },
      text.fontSize,
      textBleed(text),
      area
    );
    label.position({ x, y });
    layer.destroyChildren();
    layer.scale({ x: scale, y: scale });
    layer.add(label);
    stage.size(area);
    layer.draw();
  }, [hostRef, text, isFontReady, maxWidth]);

  useLayoutEffect(
    function drawOnChange() {
      draw();
    },
    [draw]
  );

  useResizeObserver(hostRef, draw);
};
