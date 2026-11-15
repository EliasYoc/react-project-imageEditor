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
import { SLIDER_STEPS, sizeToSlider, sliderToSize } from "./sizeScale";

/**
 * Slider lateral de tamaño: el del pincel en modo Dibujar y el del texto
 * seleccionado en modo Texto, los dos con escala cuadrática (ver sizeScale).
 */
const SizeSlider = () => {
  const mode = useEditorStore((state) => state.mode);
  const brushSize = useEditorStore((state) => selectCurrentBrush(state).size);
  const selectedText = useEditorStore(selectSelectedText);
  const setBrushSize = useEditorStore((state) => state.setBrushSize);
  const editElement = useEditorStore((state) => state.editElement);

  if (mode === "draw") {
    return (
      <PixelRange
        value={sizeToSlider(brushSize, BRUSH_SIZE_RANGE)}
        min={0}
        max={SLIDER_STEPS}
        onChange={(position) =>
          setBrushSize(sliderToSize(position, BRUSH_SIZE_RANGE))
        }
      />
    );
  }

  if (mode === "text" && selectedText) {
    return (
      <PixelRange
        value={sizeToSlider(selectedText.fontSize, TEXT_SIZE_RANGE)}
        min={0}
        max={SLIDER_STEPS}
        // Mover el slider crea un solo paso del historial.
        onChange={(position) =>
          editElement(
            selectedText.id,
            { fontSize: sliderToSize(position, TEXT_SIZE_RANGE) },
            `fontSize:${selectedText.id}`
          )
        }
      />
    );
  }

  return null;
};

export default SizeSlider;
