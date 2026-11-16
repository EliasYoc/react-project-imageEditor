import { Slider } from "../../../components/ui/Slider";
import { getBrushPreset } from "../../../editor/engine/brushes/presets";
import { BRUSH_SIZE_RANGE } from "../../../editor/model/factories";
import { useEditorStore } from "../../../editor/store/editorStore";
import {
  selectBrushPresetId,
  selectCurrentBrush,
} from "../../../editor/store/selectors";
import styles from "./BrushLibrary.module.css";
import { SLIDER_STEPS, sizeToSlider, sliderToSize } from "../utils/sizeScale";

const percent = (value: number) => `${Math.round(value * 100)} %`;

/**
 * Ajustes del pincel actual. Cada preset recuerda los suyos: cambiar la
 * opacidad del Marcador no cambia la del Lápiz.
 */
const BrushSettingsPanel = () => {
  const presetId = useEditorStore(selectBrushPresetId);
  const { size, opacity, stabilizer } = useEditorStore(selectCurrentBrush);
  const setBrushSize = useEditorStore((state) => state.setBrushSize);
  const setBrushOpacity = useEditorStore((state) => state.setBrushOpacity);
  const setBrushStabilizer = useEditorStore(
    (state) => state.setBrushStabilizer
  );

  return (
    <section
      className={styles.settings}
      aria-label={`Ajustes de ${getBrushPreset(presetId).name}`}
    >
      <h3 className={styles.title}>
        Ajustes de {getBrushPreset(presetId).name}
      </h3>
      {/* Escala cuadrática, como el slider lateral: precisión en tamaños pequeños. */}
      <Slider
        label="Tamaño"
        min={0}
        max={SLIDER_STEPS}
        value={sizeToSlider(size, BRUSH_SIZE_RANGE)}
        valueText={`${size} px`}
        onChange={(position) =>
          setBrushSize(sliderToSize(position, BRUSH_SIZE_RANGE))
        }
      />
      <Slider
        label="Opacidad"
        min={1}
        max={100}
        value={Math.round(opacity * 100)}
        valueText={percent(opacity)}
        onChange={(value) => setBrushOpacity(value / 100)}
      />
      <Slider
        label="Estabilización"
        min={0}
        max={100}
        value={Math.round(stabilizer * 100)}
        valueText={percent(stabilizer)}
        onChange={(value) => setBrushStabilizer(value / 100)}
      />
    </section>
  );
};

export default BrushSettingsPanel;
