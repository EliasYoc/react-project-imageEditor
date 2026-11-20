import { useId, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { ColorPicker } from "../../../../components/ui/ColorControl";
import { Segmented } from "../../../../components/ui/Segmented";
import { Slider } from "../../../../components/ui/Slider";
import { gradientToCss } from "../../../../editor/engine/fill/css";
import { supportsConicGradient } from "../../../../editor/engine/fill/paintFill";
import {
  COLOR_PRESETS,
  GRADIENT_PRESETS,
} from "../../../../editor/engine/fill/presets";
import {
  MIN_STOPS,
  removeStop,
  setStopColor,
} from "../../../../editor/engine/fill/stops";
import type {
  Backdrop,
  BackdropBlend,
  Fill,
  Gradient,
  GradientType,
  Rgba,
} from "../../../../editor/model/types";
import { useEditorStore } from "../../../../editor/store/editorStore";
import AngleDial from "../AngleDial/AngleDial";
import styles from "./BackdropPanel.module.css";
import GradientPreview from "../GradientPreview/GradientPreview";
import GradientStopsBar from "../GradientStopsBar/GradientStopsBar";

type Tab = "none" | "color" | "gradient";

const TABS: { value: Tab; label: string }[] = [
  { value: "none", label: "Ninguno" },
  { value: "color", label: "Color" },
  { value: "gradient", label: "Degradado" },
];

const TYPES: { value: GradientType; label: string }[] = [
  { value: "linear", label: "Lineal" },
  { value: "radial", label: "Radial" },
  { value: "conic", label: "Cónico" },
];

const BLENDS: { blend: BackdropBlend; label: string }[] = [
  { blend: "source-over", label: "Normal" },
  { blend: "multiply", label: "Multiplicar" },
  { blend: "screen", label: "Trama" },
  { blend: "overlay", label: "Superponer" },
  { blend: "soft-light", label: "Luz suave" },
  { blend: "color", label: "Color" },
];

const DEFAULT_COLOR: Rgba = { r: 255, g: 255, b: 255, a: 1 };

const tabOf = (fill: Fill | null): Tab =>
  fill === null ? "none" : fill.kind === "color" ? "color" : "gradient";

/**
 * Capa de color o degradado. Sin foto ni video es el fondo del lienzo; con
 * uno de ellos se pone encima como un filtro (opacidad y modo de fusión), sin
 * reemplazarlo.
 *
 * Todo se aplica en vivo (el lienzo se ve detrás de la hoja) y cada ajuste es
 * un paso del historial: para volver atrás, se deshace.
 */
const BackdropPanel = () => {
  const backdrop = useEditorStore((state) => state.backdrop);
  // Lo que hay de fondo: una foto o un video (null en un lienzo en blanco).
  const backgroundName = useEditorStore((state) =>
    state.photo.video ? "video" : state.photo.source ? "foto" : null
  );
  const hasBackground = backgroundName !== null;
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const setBackdrop = useEditorStore((state) => state.setBackdrop);
  const blendId = useId();
  const { fill } = backdrop;

  // Lo último elegido en cada pestaña, para no perderlo al cambiar de pestaña.
  const [lastColor, setLastColor] = useState<Rgba>(
    fill?.kind === "color" ? fill.color : DEFAULT_COLOR
  );
  const [lastGradient, setLastGradient] = useState<Gradient>(
    fill?.kind === "gradient" ? fill.gradient : GRADIENT_PRESETS[0].gradient
  );
  const gradient = fill?.kind === "gradient" ? fill.gradient : lastGradient;
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    gradient.stops[0]?.id ?? null
  );
  const selectedStop =
    gradient.stops.find((stop) => stop.id === selectedStopId) ??
    gradient.stops[0];

  const update = (patch: Partial<Backdrop>, mergeKey?: string) =>
    setBackdrop({ ...backdrop, ...patch }, mergeKey);

  const setColor = (color: Rgba, mergeKey?: string) => {
    setLastColor(color);
    update({ fill: { kind: "color", color } }, mergeKey);
  };

  const setGradient = (next: Gradient, mergeKey?: string) => {
    setLastGradient(next);
    update({ fill: { kind: "gradient", gradient: next } }, mergeKey);
  };

  const chooseTab = (tab: Tab) => {
    if (tab === tabOf(fill)) return;
    if (tab === "none") update({ fill: null });
    else if (tab === "color") setColor(lastColor);
    else setGradient(lastGradient);
  };

  const tab = tabOf(fill);
  const layerTitle =
    backgroundName === "video"
      ? "Sobre el video"
      : backgroundName === "foto"
        ? "Sobre la foto"
        : "Capa";

  return (
    <div className={styles.panel}>
      <Segmented
        label="Tipo de fondo"
        value={tabOf(fill)}
        onChange={chooseTab}
        items={TABS}
      />

      {tab === "none" && (
        <p className={styles.hint}>
          {backgroundName === "video" &&
            "El video se ve tal cual. Elige un color o un degradado para ponerlo encima como un filtro."}
          {backgroundName === "foto" &&
            "La foto se ve tal cual. Elige un color o un degradado para ponerlo encima como un filtro."}
          {!backgroundName &&
            "El lienzo es blanco. Elige un color o un degradado de fondo."}
        </p>
      )}

      {tab === "color" && fill?.kind === "color" && (
        <>
          <ColorPicker
            color={fill.color}
            onChange={(color) => setColor(color, "color")}
            hasAlpha
            swatches={COLOR_PRESETS}
          />
        </>
      )}

      {tab === "gradient" && fill?.kind === "gradient" && (
        <>
          <Segmented
            label="Forma"
            size="sm"
            value={gradient.type}
            onChange={(type) => setGradient({ ...gradient, type })}
            items={TYPES}
          />
          {gradient.type === "conic" && !supportsConicGradient() && (
            <p className={styles.hint}>
              Tu navegador no admite degradados cónicos: se muestra como radial.
            </p>
          )}

          <div className={styles.gradientRow}>
            <GradientPreview
              gradient={gradient}
              documentSize={canvasSize}
              onCenterChange={(center) =>
                setGradient({ ...gradient, center }, "center")
              }
            />
            {gradient.type !== "radial" && (
              <AngleDial
                value={gradient.angle}
                label={gradient.type === "conic" ? "Inicio" : "Ángulo"}
                onChange={(angle) =>
                  setGradient({ ...gradient, angle }, "angle")
                }
              />
            )}
          </div>

          <GradientStopsBar
            gradient={gradient}
            selectedId={selectedStop?.id ?? null}
            onSelect={setSelectedStopId}
            onChange={setGradient}
          />

          {selectedStop && (
            <div className={styles.stopEditor}>
              {/* Justo debajo de la barra de paradas, que es lo que quita. */}
              <Button
                size="sm"
                disabled={gradient.stops.length <= MIN_STOPS}
                onClick={() =>
                  setGradient(removeStop(gradient, selectedStop.id))
                }
              >
                Quitar parada
              </Button>
              <ColorPicker
                color={selectedStop.color}
                hasAlpha
                onChange={(color) =>
                  setGradient(
                    setStopColor(gradient, selectedStop.id, color),
                    `stopColor:${selectedStop.id}`
                  )
                }
              />
            </div>
          )}

          <div className={styles.presets} role="group" aria-label="Degradados">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={styles.preset}
                style={{ backgroundImage: gradientToCss(preset.gradient) }}
                aria-label={preset.label}
                title={preset.label}
                onClick={() => {
                  setGradient(preset.gradient);
                  setSelectedStopId(preset.gradient.stops[0].id);
                }}
              />
            ))}
          </div>
        </>
      )}

      {fill && (
        <section className={styles.section} aria-label={layerTitle}>
          <h3 className={styles.title}>{layerTitle}</h3>
          <Slider
            label="Opacidad"
            min={5}
            max={100}
            value={Math.round(backdrop.opacity * 100)}
            valueText={`${Math.round(backdrop.opacity * 100)} %`}
            onChange={(value) => update({ opacity: value / 100 }, "opacity")}
          />
          {hasBackground && (
            <div className={styles.field}>
              <label htmlFor={blendId}>Modo de fusión</label>
              <select
                id={blendId}
                className={styles.select}
                value={backdrop.blend}
                onChange={(event) =>
                  update({ blend: event.target.value as BackdropBlend })
                }
              >
                {BLENDS.map(({ blend, label }) => (
                  <option key={blend} value={blend}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default BackdropPanel;
