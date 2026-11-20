import { useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { AngleDial } from "../../../../components/ui/AngleDial";
import { GradientStopsBar } from "../../../../components/ui/GradientStopsBar";
import { Segmented } from "../../../../components/ui/Segmented";
import {
  MIN_STOPS,
  removeStop,
  setStopColor,
} from "../../../../editor/engine/fill/stops";
import { textGradientCss } from "../../../../editor/elements/textGradient";
import type { Gradient, GradientType } from "../../../../editor/model/types";
import ColorField from "../ColorField/ColorField";
import styles from "./TextGradientEditor.module.css";
import { TEXT_GRADIENT_PRESETS } from "../../constants/textGradientPresets";

const TYPES: { value: GradientType; label: string }[] = [
  { value: "linear", label: "Lineal" },
  { value: "radial", label: "Radial" },
];

interface TextGradientEditorProps {
  gradient: Gradient;
  /** `mergeKey`: arrastrar una parada o el dial es un solo paso del historial. */
  onChange: (gradient: Gradient, mergeKey?: string) => void;
  isColorOpen: boolean;
  onToggleColor: () => void;
}

/**
 * Degradado del texto: forma (lineal o radial), ángulo, paradas y presets.
 * Reutiliza la barra de paradas y el dial del editor de fondo.
 */
const TextGradientEditor = ({
  gradient,
  onChange,
  isColorOpen,
  onToggleColor,
}: TextGradientEditorProps) => {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    gradient.stops[0]?.id ?? null
  );
  const selectedStop =
    gradient.stops.find((stop) => stop.id === selectedStopId) ??
    gradient.stops[0];

  return (
    <>
      <Segmented
        label="Forma del degradado"
        size="sm"
        value={gradient.type}
        onChange={(type) => onChange({ ...gradient, type })}
        items={TYPES}
      />

      <div className={styles.gradientRow}>
        {/* Muestra con letras: así se verá el texto. */}
        <span
          className={styles.gradientSample}
          style={{ backgroundImage: textGradientCss(gradient) }}
          aria-hidden="true"
        >
          Aa
        </span>
        {gradient.type === "linear" && (
          <AngleDial
            value={gradient.angle}
            onChange={(angle) =>
              onChange({ ...gradient, angle }, "gradientAngle")
            }
          />
        )}
      </div>

      <GradientStopsBar
        gradient={gradient}
        selectedId={selectedStop?.id ?? null}
        onSelect={setSelectedStopId}
        onChange={onChange}
      />

      {selectedStop && (
        <div className={styles.stopRow}>
          {/* Justo debajo de la barra de paradas, que es lo que quita. */}
          <Button
            size="sm"
            disabled={gradient.stops.length <= MIN_STOPS}
            onClick={() => onChange(removeStop(gradient, selectedStop.id))}
          >
            Quitar parada
          </Button>
          <ColorField
            label="Color de la parada"
            color={selectedStop.color}
            isOpen={isColorOpen}
            onToggle={onToggleColor}
            onChange={(color) =>
              onChange(
                setStopColor(gradient, selectedStop.id, color),
                `gradientStopColor:${selectedStop.id}`
              )
            }
          />
        </div>
      )}

      <div className={styles.presets} role="group" aria-label="Degradados">
        {TEXT_GRADIENT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={styles.preset}
            style={{ backgroundImage: textGradientCss(preset.gradient) }}
            aria-label={preset.label}
            title={preset.label}
            onClick={() => {
              onChange(preset.gradient);
              setSelectedStopId(preset.gradient.stops[0].id);
            }}
          />
        ))}
      </div>
    </>
  );
};

export default TextGradientEditor;
