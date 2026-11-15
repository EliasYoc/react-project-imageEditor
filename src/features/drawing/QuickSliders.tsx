import { VerticalSlider } from "../../components/ui/VerticalSlider";
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
import styles from "./QuickSliders.module.css";

/** Pasos del slider de tamaño (de SLIDER_STEPS): el teclado mueve algo visible. */
const SIZE_STEP = 5;

/**
 * Sliders rápidos del borde izquierdo, siempre a la vista (antes el de tamaño
 * asomaba a medias y solo salía con hover, que no existe en el móvil):
 *
 * - modo Dibujar: tamaño y opacidad del pincel actual;
 * - modo Texto: tamaño de letra del texto seleccionado (un solo paso del
 *   historial por arrastre).
 *
 * Los tamaños usan escala cuadrática (ver `sizeScale`): más recorrido para
 * los tamaños pequeños.
 */
const QuickSliders = () => {
  const mode = useEditorStore((state) => state.mode);
  const brush = useEditorStore(selectCurrentBrush);
  const selectedText = useEditorStore(selectSelectedText);
  const setBrushSize = useEditorStore((state) => state.setBrushSize);
  const setBrushOpacity = useEditorStore((state) => state.setBrushOpacity);
  const editElement = useEditorStore((state) => state.editElement);

  if (mode === "draw") {
    const opacity = Math.round(brush.opacity * 100);
    return (
      <div className={styles.sliders}>
        <VerticalSlider
          label="Tamaño"
          value={sizeToSlider(brush.size, BRUSH_SIZE_RANGE)}
          min={0}
          max={SLIDER_STEPS}
          step={SIZE_STEP}
          valueText={`${brush.size} px`}
          onChange={(position) =>
            setBrushSize(sliderToSize(position, BRUSH_SIZE_RANGE))
          }
        />
        <VerticalSlider
          label="Opacidad"
          value={opacity}
          min={1}
          max={100}
          valueText={`${opacity} %`}
          onChange={(value) => setBrushOpacity(value / 100)}
        />
      </div>
    );
  }

  if (mode === "text" && selectedText) {
    return (
      <div className={styles.sliders}>
        <VerticalSlider
          label="Tamaño"
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

export default QuickSliders;
