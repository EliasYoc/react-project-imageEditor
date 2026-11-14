import { MdFitScreen, MdZoomIn, MdZoomOut } from "react-icons/md";
import { IconButton } from "../../components/ui/Button";
import { zoomLimits } from "../../editor/engine/viewport";
import { ZOOM_STEP, useViewStore } from "../../editor/stage/viewStore";
import { useEditorStore } from "../../editor/store/editorStore";
import styles from "./ZoomControls.module.css";

/**
 * Zoom con botones: alejar, porcentaje, acercar y ajustar a pantalla.
 * El 100 % es el tamaño real: 1 píxel de la imagen = 1 píxel de pantalla.
 * En pantallas táctiles se ocultan + y − (se usa el pellizco).
 */
const ZoomControls = () => {
  const scale = useViewStore((state) => state.view.scale);
  const isFitted = useViewStore((state) => state.isFitted);
  const stageSize = useViewStore((state) => state.stageSize);
  const zoomBy = useViewStore((state) => state.zoomBy);
  const fitToScreen = useViewStore((state) => state.fitToScreen);
  const canvasSize = useEditorStore((state) => state.canvasSize);

  const limits = zoomLimits(stageSize, canvasSize);
  // Margen pequeño: la escala límite puede no coincidir exactamente.
  const canZoomOut = scale > limits.min * 1.001;
  const canZoomIn = scale < limits.max * 0.999;

  return (
    <div className={styles.controls} role="toolbar" aria-label="Zoom">
      <IconButton
        icon={MdZoomOut}
        aria-label="Alejar"
        className={styles.stepButton}
        disabled={!canZoomOut}
        onClick={() => zoomBy(1 / ZOOM_STEP)}
      />
      <span className={styles.percent} title="Nivel de zoom">
        {Math.round(scale * 100)} %
      </span>
      <IconButton
        icon={MdZoomIn}
        aria-label="Acercar"
        className={styles.stepButton}
        disabled={!canZoomIn}
        onClick={() => zoomBy(ZOOM_STEP)}
      />
      <IconButton
        icon={MdFitScreen}
        aria-label="Ajustar a la pantalla"
        aria-pressed={isFitted}
        onClick={fitToScreen}
      />
    </div>
  );
};

export default ZoomControls;
