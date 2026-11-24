import { Layer } from "konva/lib/Layer";
import { Stage } from "konva/lib/Stage";
import { useCallback, useLayoutEffect, useRef } from "react";
import { readableBackdrop } from "../../../../editor/elements/readableBackdrop";
import { createTextLabel } from "../../../../editor/elements/textShape";
import { rgbaToCss } from "../../../../editor/model/color";
import type { TextElement } from "../../../../editor/model/types";
import {
  useFontReady,
  useMaxTextWidth,
} from "../../../../editor/stage/elementHooks";
import { useResizeObserver } from "../../../../hooks/useResizeObserver";
import { PREVIEW_HEIGHT, PREVIEW_PADDING } from "../../constants/textPreview";
import { previewLayout, previewText, textBleed } from "../../utils/textPreview";
import styles from "./TextPreview.module.css";

/**
 * Vista previa del texto seleccionado, fija arriba del panel «Fuente y
 * estilo» mientras se hace scroll. Es un lienzo pequeño de Konva con la misma
 * configuración que el lienzo y la exportación (`createTextLabel`), así que
 * el contorno, la sombra, el degradado y la caja se ven igual. No representa
 * el lienzo del documento: el fondo es blanco, o gris oscuro si el texto es
 * claro.
 */
const TextPreview = ({ text }: { text: TextElement }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ stage: Stage; layer: Layer } | null>(null);
  const isFontReady = useFontReady(text.fontId, text.fontWeight);
  // El mismo tope de ancho que en el lienzo: se reparte en las mismas líneas.
  const maxWidth = useMaxTextWidth();

  useLayoutEffect(function createScene() {
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
  }, []);

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
  }, [text, isFontReady, maxWidth]);

  useLayoutEffect(
    function drawOnChange() {
      draw();
    },
    [draw]
  );

  useResizeObserver(hostRef, draw);

  return (
    <div className={styles.bar}>
      <div
        className={styles.preview}
        role="img"
        aria-label="Vista previa del texto"
        style={{ backgroundColor: rgbaToCss(readableBackdrop(text)) }}
      >
        {/* Con su alto desde el principio: el panel no salta al crearse Konva. */}
        <div
          ref={hostRef}
          className={styles.canvas}
          style={{ height: PREVIEW_HEIGHT }}
        />
      </div>
    </div>
  );
};

export default TextPreview;
