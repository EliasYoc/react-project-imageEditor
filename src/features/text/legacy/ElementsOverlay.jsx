import { useRef, useState } from "react";
import PortalNormalModal from "../../../components/layout/PortalNormalModal";
import { documentRectOnScreen } from "../../../editor/engine/viewport";
import { useStageHandles } from "../../../editor/stage/stageContext";
import { useViewStore } from "../../../editor/stage/viewStore";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectElements } from "../../../editor/store/selectors";
import ElementEditable from "./ElementEditable";
import styles from "./ElementsOverlay.module.css";

/**
 * Capa HTML encima del lienzo con los textos e imágenes (react-moveable).
 *
 * En modo Dibujar no recibe el puntero: los eventos llegan al lienzo de Konva
 * que está debajo. Se reemplaza por nodos de Konva en la Fase 4.
 */
const ElementsOverlay = () => {
  const { documentFrameRef } = useStageHandles();
  const isEditingText = useEditorStore((state) => state.mode === "text");
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const elements = useEditorStore(selectElements);
  const view = useViewStore((state) => state.view);
  const [checkInput, setCheckInput] = useState(false);
  const containerRef = useRef(null);

  const frame = documentRectOnScreen(canvasSize, view);

  return (
    <div
      ref={containerRef}
      className={styles.overlay}
      data-interactive={isEditingText || undefined}
    >
      <PortalNormalModal
        isOpen={checkInput}
        onClose={() => setCheckInput(false)}
      />
      <div
        ref={documentFrameRef}
        className={styles.documentFrame}
        style={{
          left: frame.left,
          top: frame.top,
          width: frame.width,
          height: frame.height,
        }}
        aria-hidden="true"
      />
      {elements.map((element) => (
        <ElementEditable
          key={element.id}
          element={element}
          containerRef={containerRef}
          setCheckInput={setCheckInput}
        />
      ))}
    </div>
  );
};

export default ElementsOverlay;
