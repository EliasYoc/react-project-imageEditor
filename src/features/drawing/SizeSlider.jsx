import PixelRange from "../../components/ui/PixelRange/PixelRange";
import {
  BRUSH_SIZE_RANGE,
  TEXT_SIZE_RANGE,
} from "../../editor/model/factories";
import { useEditorStore } from "../../editor/store/editorStore";
import {
  selectCurrentBrush,
  selectSelectedText,
} from "../../editor/store/selectors";

/**
 * Slider lateral de tamaño: el del pincel en modo Dibujar y el del texto
 * seleccionado en modo Texto.
 */
const SizeSlider = () => {
  const mode = useEditorStore((state) => state.mode);
  const brushSize = useEditorStore((state) => selectCurrentBrush(state).size);
  const selectedText = useEditorStore(selectSelectedText);
  const setBrushSize = useEditorStore((state) => state.setBrushSize);
  const updateElement = useEditorStore((state) => state.updateElement);

  if (mode === "draw") {
    return (
      <PixelRange
        value={brushSize}
        min={BRUSH_SIZE_RANGE.min}
        max={BRUSH_SIZE_RANGE.max}
        onChange={setBrushSize}
      />
    );
  }

  if (mode === "text" && selectedText) {
    return (
      <PixelRange
        value={selectedText.fontSize}
        min={TEXT_SIZE_RANGE.min}
        max={TEXT_SIZE_RANGE.max}
        onChange={(fontSize) => updateElement(selectedText.id, { fontSize })}
      />
    );
  }

  return null;
};

export default SizeSlider;
