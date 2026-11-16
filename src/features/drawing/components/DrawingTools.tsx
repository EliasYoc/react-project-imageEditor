import { useState } from "react";
import { IconButton } from "../../../components/ui/Button";
import { ColorControl } from "../../../components/ui/ColorControl";
import { Panel } from "../../../components/ui/Panel";
import { getBrushPreset } from "../../../editor/engine/brushes/presets";
import { COLOR_PRESETS } from "../../../editor/engine/fill/presets";
import { useEditorStore } from "../../../editor/store/editorStore";
import {
  selectBrushColor,
  selectBrushPresetId,
} from "../../../editor/store/selectors";
import { SHORTCUT_LABELS } from "../../shortcuts";
import BrushLibrary from "./BrushLibrary";
import { BRUSH_ICONS } from "../constants/brushIcons";
import styles from "./DrawingTools.module.css";

/**
 * Herramientas de dibujo: pincel, borrador y color.
 *
 * Como en Procreate: pulsar la herramienta que NO está activa cambia a ella
 * (al último pincel o borrador usado); pulsar la que ya está activa abre la
 * biblioteca de pinceles para elegir otro.
 */
const DrawingTools = () => {
  const presetId = useEditorStore(selectBrushPresetId);
  const lastDrawId = useEditorStore((state) => state.brush.lastDrawPresetId);
  const lastEraserId = useEditorStore(
    (state) => state.brush.lastEraserPresetId
  );
  const color = useEditorStore(selectBrushColor);
  const setBrushColor = useEditorStore((state) => state.setBrushColor);
  const selectDrawBrush = useEditorStore((state) => state.selectDrawBrush);
  const selectEraser = useEditorStore((state) => state.selectEraser);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const isErasing = getBrushPreset(presetId).kind === "eraser";
  const drawBrush = getBrushPreset(lastDrawId);
  const eraser = getBrushPreset(lastEraserId);

  return (
    <>
      <IconButton
        icon={BRUSH_ICONS[lastDrawId]}
        aria-label={`Pincel: ${drawBrush.name}`}
        title={isErasing ? `Pincel: ${drawBrush.name}` : "Elegir otro pincel"}
        shortcut={SHORTCUT_LABELS.drawBrush}
        aria-pressed={!isErasing}
        className={styles.tool}
        onClick={() => (isErasing ? selectDrawBrush() : setIsLibraryOpen(true))}
      />
      <IconButton
        icon={BRUSH_ICONS[lastEraserId]}
        aria-label={`Borrador: ${eraser.name}`}
        title={isErasing ? "Elegir otro borrador" : `Borrador: ${eraser.name}`}
        shortcut={SHORTCUT_LABELS.eraser}
        aria-pressed={isErasing}
        className={styles.tool}
        onClick={() => (isErasing ? setIsLibraryOpen(true) : selectEraser())}
      />
      {/* Sin transparencia: la del trazo es la opacidad de cada pincel. */}
      <ColorControl
        label="Color del pincel"
        color={color}
        onChange={setBrushColor}
        swatches={COLOR_PRESETS}
      />
      <Panel
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        title="Pinceles"
      >
        <BrushLibrary />
      </Panel>
    </>
  );
};

export default DrawingTools;
