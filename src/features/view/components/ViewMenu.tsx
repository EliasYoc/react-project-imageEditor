import { Ellipsis, Eye, EyeOff, Scan, ZoomIn, ZoomOut } from "lucide-react";
import { useUiStore } from "../../../app/uiStore";
import { IconButton } from "../../../components/ui/Button";
import { Menu, type MenuItem } from "../../../components/ui/Menu";
import { zoomLimits } from "../../../editor/engine/viewport";
import { ZOOM_STEP, useViewStore } from "../../../editor/stage/viewStore";
import { useEditorStore } from "../../../editor/store/editorStore";
import styles from "./ViewMenu.module.css";

/**
 * Opciones de la vista, en un menú en la esquina de abajo a la derecha:
 * el nivel de zoom, acercar, alejar, ajustar a la pantalla y ocultar o
 * mostrar las barras (cabecera y barra inferior).
 *
 * Acercar y alejar dejan el menú abierto: se pueden pulsar varias veces
 * viendo cómo cambia el porcentaje. El 100 % es el tamaño real: 1 píxel de
 * la imagen = 1 píxel de pantalla.
 */
const ViewMenu = () => {
  const scale = useViewStore((state) => state.view.scale);
  const stageSize = useViewStore((state) => state.stageSize);
  const insets = useViewStore((state) => state.insets);
  const zoomBy = useViewStore((state) => state.zoomBy);
  const fitToScreen = useViewStore((state) => state.fitToScreen);
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const areBarsHidden = useUiStore((state) => state.areBarsHidden);
  const toggleBars = useUiStore((state) => state.toggleBars);

  const limits = zoomLimits(stageSize, canvasSize, insets);
  // Margen pequeño: la escala límite puede no coincidir exactamente.
  const canZoomOut = scale > limits.min * 1.001;
  const canZoomIn = scale < limits.max * 0.999;

  const items: MenuItem[] = [
    {
      label: "Acercar",
      icon: ZoomIn,
      keepOpen: true,
      disabled: !canZoomIn,
      onSelect: () => zoomBy(ZOOM_STEP),
    },
    {
      label: "Alejar",
      icon: ZoomOut,
      keepOpen: true,
      disabled: !canZoomOut,
      onSelect: () => zoomBy(1 / ZOOM_STEP),
    },
    { label: "Ajustar a la pantalla", icon: Scan, onSelect: fitToScreen },
    areBarsHidden
      ? { label: "Mostrar las barras", icon: Eye, onSelect: toggleBars }
      : { label: "Ocultar las barras", icon: EyeOff, onSelect: toggleBars },
  ];

  return (
    <div className={styles.controls}>
      <Menu
        trigger={
          <IconButton icon={Ellipsis} aria-label="Más opciones de la vista" />
        }
        label={`Zoom: ${Math.round(scale * 100)} %`}
        items={items}
        side="top"
      />
    </div>
  );
};

export default ViewMenu;
