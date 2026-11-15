import { useState } from "react";
import PortalsSwipeableMenuLayout from "../../components/layout/PortalsSwipeableMenuLayout";
import { IconButton } from "../../components/ui/Button";
import {
  GlobalButton,
  PencilBackgroundColor,
} from "../../components/ui/legacy/styledComponents";
import { getBrushPreset } from "../../editor/engine/brushes/presets";
import { rgbaToCss } from "../../editor/model/color";
import { useEditorStore } from "../../editor/store/editorStore";
import {
  selectBrushColor,
  selectBrushPresetId,
} from "../../editor/store/selectors";
import BrushColorPicker from "./BrushColorPicker";
import BrushLibrary from "./BrushLibrary";
import { BRUSH_ICONS } from "./brushIcons";
import styles from "./DrawingTools.module.css";

/**
 * Herramientas de dibujo: pincel, borrador y color.
 *
 * Como en Procreate: pulsar la herramienta que NO está activa cambia a ella
 * (al último pincel o borrador usado); pulsar la que ya está activa abre la
 * lista de pinceles para elegir otro.
 */
const DrawingTools = () => {
  const presetId = useEditorStore(selectBrushPresetId);
  const lastDrawId = useEditorStore((state) => state.brush.lastDrawPresetId);
  const lastEraserId = useEditorStore(
    (state) => state.brush.lastEraserPresetId
  );
  const color = useEditorStore(selectBrushColor);
  const selectDrawBrush = useEditorStore((state) => state.selectDrawBrush);
  const selectEraser = useEditorStore((state) => state.selectEraser);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const isErasing = getBrushPreset(presetId).kind === "eraser";
  const drawBrush = getBrushPreset(lastDrawId);
  const eraser = getBrushPreset(lastEraserId);

  return (
    <>
      <IconButton
        icon={BRUSH_ICONS[lastDrawId]}
        aria-label={`Pincel: ${drawBrush.name}`}
        title={isErasing ? `Pincel: ${drawBrush.name}` : "Elegir otro pincel"}
        aria-pressed={!isErasing}
        className={styles.tool}
        onClick={() => (isErasing ? selectDrawBrush() : setIsLibraryOpen(true))}
      />
      <IconButton
        icon={BRUSH_ICONS[lastEraserId]}
        aria-label={`Borrador: ${eraser.name}`}
        title={isErasing ? "Elegir otro borrador" : `Borrador: ${eraser.name}`}
        aria-pressed={isErasing}
        className={styles.tool}
        onClick={() => (isErasing ? setIsLibraryOpen(true) : selectEraser())}
      />
      {/* El tamaño de cada cuadro del fondo a cuadros es la mitad de background-size. */}
      <GlobalButton
        border="3px solid var(--color-text)"
        backgroundColor="#eee"
        backgroundImage="linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0),
                  linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0);"
        backgroundPosition="0 0, 7.5px 7.5px"
        backgroundSize="15px 15px"
        onClick={() => setIsColorPickerOpen(true)}
        padding="0"
        aria-label="Color del pincel"
      >
        <PencilBackgroundColor
          style={{
            border: `4px solid black`,
            borderRadius: "50px",
          }}
          backgroundColor={rgbaToCss(color)}
        />
      </GlobalButton>

      <PortalsSwipeableMenuLayout
        title="Pinceles"
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      >
        <BrushLibrary />
      </PortalsSwipeableMenuLayout>

      <PortalsSwipeableMenuLayout
        title="Color del pincel"
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
      >
        <BrushColorPicker />
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default DrawingTools;
