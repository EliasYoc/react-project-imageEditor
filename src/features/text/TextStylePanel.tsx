import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Segmented, type SegmentedItem } from "../../components/ui/Segmented";
import { Slider } from "../../components/ui/Slider";
import type {
  Gradient,
  TextAlign,
  TextElement,
  TextStyle,
} from "../../editor/model/types";
import { useEditorStore } from "../../editor/store/editorStore";
import ColorField from "./ColorField";
import TextGradientEditor from "./TextGradientEditor";
import styles from "./TextPanels.module.css";
import { DEFAULT_TEXT_GRADIENT } from "./textGradientPresets";

const ALIGNMENTS: readonly SegmentedItem<TextAlign>[] = [
  { value: "left", label: "Alinear a la izquierda", icon: AlignLeft },
  { value: "center", label: "Centrar", icon: AlignCenter },
  { value: "right", label: "Alinear a la derecha", icon: AlignRight },
];

type ColorTarget = "gradient" | "stroke" | "shadow" | "background";

const percent = (value: number) => `${Math.round(value)} %`;

/** Sección que se activa con una casilla (contorno, sombra, caja). */
const ToggleSection = ({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}) => (
  <section className={styles.section} aria-label={title}>
    <label className={styles.sectionHeader}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onToggle(event.target.checked)}
      />
      {title}
    </label>
    {enabled && <div className={styles.sectionBody}>{children}</div>}
  </section>
);

/**
 * Estilo del texto seleccionado: alineación, interlineado, degradado,
 * contorno, sombra y caja de fondo. Las medidas van en % del tamaño de letra.
 *
 * Arrastrar un slider o un selector de color crea un solo paso del historial
 * (mergeKey por ajuste).
 */
const TextStylePanel = ({ text }: { text: TextElement }) => {
  const editElement = useEditorStore((state) => state.editElement);
  const [openColor, setOpenColor] = useState<ColorTarget | null>(null);
  // El último degradado usado: al desactivarlo y volver a activarlo no se pierde.
  const [lastGradient, setLastGradient] = useState<Gradient>(
    text.gradient ?? DEFAULT_TEXT_GRADIENT
  );

  const edit = (patch: Partial<TextStyle>, mergeKey?: string) =>
    editElement(text.id, patch, mergeKey && `${mergeKey}:${text.id}`);
  const toggleColor = (target: ColorTarget) =>
    setOpenColor(openColor === target ? null : target);
  const setGradient = (gradient: Gradient, mergeKey?: string) => {
    setLastGradient(gradient);
    edit({ gradient }, mergeKey);
  };

  const { stroke, shadow, background } = text;

  return (
    <div className={styles.panel}>
      <Segmented
        label="Alineación"
        value={text.align}
        onChange={(align) => edit({ align })}
        items={ALIGNMENTS}
        iconOnly
      />
      <Slider
        label="Interlineado"
        min={80}
        max={200}
        step={5}
        value={Math.round(text.lineHeight * 100)}
        valueText={text.lineHeight.toFixed(2)}
        onChange={(value) => edit({ lineHeight: value / 100 }, "lineHeight")}
      />

      <ToggleSection
        title="Degradado"
        enabled={text.gradient !== null}
        onToggle={(enabled) =>
          edit({ gradient: enabled ? lastGradient : null })
        }
      >
        {text.gradient && (
          <TextGradientEditor
            gradient={text.gradient}
            onChange={setGradient}
            isColorOpen={openColor === "gradient"}
            onToggleColor={() => toggleColor("gradient")}
          />
        )}
      </ToggleSection>

      <ToggleSection
        title="Contorno"
        enabled={stroke.enabled}
        onToggle={(enabled) => edit({ stroke: { ...stroke, enabled } })}
      >
        <ColorField
          label="Color del contorno"
          color={stroke.color}
          isOpen={openColor === "stroke"}
          onToggle={() => toggleColor("stroke")}
          onChange={(color) =>
            edit({ stroke: { ...stroke, color } }, "strokeColor")
          }
        />
        <Slider
          label="Grosor"
          min={1}
          max={25}
          value={Math.round(stroke.width * 100)}
          valueText={percent(stroke.width * 100)}
          onChange={(value) =>
            edit({ stroke: { ...stroke, width: value / 100 } }, "strokeWidth")
          }
        />
      </ToggleSection>

      <ToggleSection
        title="Sombra"
        enabled={shadow.enabled}
        onToggle={(enabled) => edit({ shadow: { ...shadow, enabled } })}
      >
        <ColorField
          label="Color de la sombra"
          color={shadow.color}
          isOpen={openColor === "shadow"}
          onToggle={() => toggleColor("shadow")}
          onChange={(color) =>
            edit({ shadow: { ...shadow, color } }, "shadowColor")
          }
        />
        <Slider
          label="Desenfoque"
          min={0}
          max={50}
          value={Math.round(shadow.blur * 100)}
          valueText={percent(shadow.blur * 100)}
          onChange={(value) =>
            edit({ shadow: { ...shadow, blur: value / 100 } }, "shadowBlur")
          }
        />
        <Slider
          label="Distancia"
          min={0}
          max={30}
          value={Math.round(shadow.offset * 100)}
          valueText={percent(shadow.offset * 100)}
          onChange={(value) =>
            edit({ shadow: { ...shadow, offset: value / 100 } }, "shadowOffset")
          }
        />
      </ToggleSection>

      <ToggleSection
        title="Caja de fondo"
        enabled={background.enabled}
        onToggle={(enabled) => edit({ background: { ...background, enabled } })}
      >
        <ColorField
          label="Color de la caja"
          color={background.color}
          isOpen={openColor === "background"}
          onToggle={() => toggleColor("background")}
          onChange={(color) =>
            edit({ background: { ...background, color } }, "backgroundColor")
          }
        />
        <Slider
          label="Margen"
          min={5}
          max={80}
          value={Math.round(background.padding * 100)}
          valueText={percent(background.padding * 100)}
          onChange={(value) =>
            edit(
              { background: { ...background, padding: value / 100 } },
              "backgroundPadding"
            )
          }
        />
        <Slider
          label="Esquinas"
          min={0}
          max={100}
          value={Math.round(background.radius * 100)}
          valueText={percent(background.radius * 100)}
          onChange={(value) =>
            edit(
              { background: { ...background, radius: value / 100 } },
              "backgroundRadius"
            )
          }
        />
      </ToggleSection>
    </div>
  );
};

export default TextStylePanel;
