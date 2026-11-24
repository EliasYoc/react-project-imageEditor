import { useLayoutEffect, useState, type RefObject } from "react";
import { useVisualViewport } from "../../../hooks/useVisualViewport";
import { textEditingBox, textEditingScale } from "../../elements/textEditorBox";
import { visibleArea } from "../../engine/viewport";
import { defaultFontSize } from "../../model/factories";
import type { Size, TextElement } from "../../model/types";
import { useEditorStore } from "../../store/editorStore";
import { useViewStore } from "../viewStore";

/**
 * Dónde y a qué escala se ve el editor (`textEditingBox`): al tamaño de un
 * texto nuevo, centrado en la zona libre del lienzo y un poco arriba, y sin
 * quedar debajo del teclado del móvil.
 *
 * `contentSize` es el tamaño del textarea sin escalar (`useFitTextarea`).
 */
export const useEditingBox = (
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  element: TextElement,
  contentSize: Size
) => {
  const view = useViewStore((state) => state.view);
  const stageSize = useViewStore((state) => state.stageSize);
  const insets = useViewStore((state) => state.insets);
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const viewport = useVisualViewport();
  // Dónde empieza el área del lienzo en la ventana: la franja que se ve viene
  // en píxeles de la ventana y el editor se coloca en los del área.
  const [stageTop, setStageTop] = useState(0);

  useLayoutEffect(
    function measureStageTop() {
      const stage = textareaRef.current?.offsetParent;
      if (stage) setStageTop(stage.getBoundingClientRect().top);
    },
    [textareaRef]
  );

  return textEditingBox(
    contentSize,
    textEditingScale(element.fontSize, defaultFontSize(canvasSize), view.scale),
    visibleArea(stageSize, insets),
    { top: viewport.top - stageTop, bottom: viewport.bottom - stageTop }
  );
};
