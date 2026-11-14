import { useRef, useState } from "react";
import PortalNormalModal from "../../../components/layout/PortalNormalModal";
import {
  documentRectOnScreen,
  fitView,
  overlayTransform,
} from "../../../editor/engine/viewport";
import { useStageHandles } from "../../../editor/stage/stageContext";
import { useDisplayView } from "../../../editor/stage/useDisplayView";
import { useViewStore } from "../../../editor/stage/viewStore";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectElements } from "../../../editor/store/selectors";
import ElementEditable from "./ElementEditable";
import styles from "./ElementsOverlay.module.css";

/**
 * Aplica el zoom de la vista a su contenido con un transform CSS.
 *
 * Es un componente aparte a propósito: es lo único que se vuelve a renderizar
 * en cada frame del zoom. Sus `children` los crea ElementsOverlay, así que
 * React no vuelve a renderizar los elementos (ni react-moveable).
 */
const ViewportLayer = ({ children }) => {
  const { view, fit } = useDisplayView();
  const { x, y, scale } = overlayTransform(view, fit);
  return (
    <div
      className={styles.viewportLayer}
      style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
    >
      {children}
    </div>
  );
};

/**
 * Capa HTML encima del lienzo con los textos e imágenes (react-moveable).
 *
 * Sus posiciones están en píxeles de pantalla de la vista ajustada; con zoom,
 * ViewportLayer las lleva a la vista actual. En modo Dibujar no recibe el
 * puntero: los eventos llegan al lienzo de Konva que está debajo. Se reemplaza
 * por nodos de Konva en la Fase 4.
 */
const ElementsOverlay = () => {
  const { documentFrameRef } = useStageHandles();
  const isEditingText = useEditorStore((state) => state.mode === "text");
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const elements = useEditorStore(selectElements);
  const stageSize = useViewStore((state) => state.stageSize);
  const [checkInput, setCheckInput] = useState(false);
  const containerRef = useRef(null);

  const frame = documentRectOnScreen(
    canvasSize,
    fitView(stageSize, canvasSize)
  );

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
      <ViewportLayer>
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
      </ViewportLayer>
    </div>
  );
};

export default ElementsOverlay;
