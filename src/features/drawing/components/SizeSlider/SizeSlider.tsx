import { VerticalSlider } from "../../../../components/ui/VerticalSlider";
import {
  BRUSH_SIZE_RANGE,
  TEXT_SIZE_RANGE,
} from "../../../../editor/model/factories";
import { useEditorStore } from "../../../../editor/store/editorStore";
import {
  selectCurrentBrush,
  selectSelectedText,
} from "../../../../editor/store/selectors";
import {
  SLIDER_STEPS,
  sizeToSlider,
  sliderToSize,
} from "../../utils/sizeScale";
import styles from "./SizeSlider.module.css";

/** Pasos del slider (de SLIDER_STEPS): con el teclado se nota el cambio. */
const SIZE_STEP = 5;

/**
 * Slider de tamaño del borde izquierdo: asoma a medias y se despliega al
 * pasar el ratón, al tocarlo o al llegar con el teclado.
 *
 * - modo Dibujar: tamaño del pincel actual;
 * - modo Texto: tamaño de letra del texto seleccionado (un solo paso del
 *   historial por arrastre).
 *
 * Escala cuadrática (ver `sizeScale`): más recorrido para los tamaños
 * pequeños.
 */
const SizeSlider = () => {
  const mode = useEditorStore((state) => state.mode);
  const brushSize = useEditorStore((state) => selectCurrentBrush(state).size);
  const selectedText = useEditorStore(selectSelectedText);
  const setBrushSize = useEditorStore((state) => state.setBrushSize);
  const editElement = useEditorStore((state) => state.editElement);

  if (mode === "draw") {
    return (
      <div className={styles.wrapper}>
        <VerticalSlider
          label="Tamaño del pincel"
          value={sizeToSlider(brushSize, BRUSH_SIZE_RANGE)}
          min={0}
          max={SLIDER_STEPS}
          step={SIZE_STEP}
          valueText={`${brushSize} px`}
          onChange={(position) =>
            setBrushSize(sliderToSize(position, BRUSH_SIZE_RANGE))
          }
        />
      </div>
    );
  }

  if (mode === "text" && selectedText) {
    return (
      <div className={styles.wrapper}>
        <VerticalSlider
          label="Tamaño del texto"
          value={sizeToSlider(selectedText.fontSize, TEXT_SIZE_RANGE)}
          min={0}
          max={SLIDER_STEPS}
          step={SIZE_STEP}
          valueText={`${selectedText.fontSize} px`}
          onChange={(position) =>
            editElement(
              selectedText.id,
              { fontSize: sliderToSize(position, TEXT_SIZE_RANGE) },
              `fontSize:${selectedText.id}`
            )
          }
        />
      </div>
    );
  }

  return null;
};

export default SizeSlider;
