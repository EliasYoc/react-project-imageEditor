import { Button } from "../../components/ui/Button";
import {
  BRUSH_PRESETS,
  BRUSH_PRESET_IDS,
  type BrushKind,
} from "../../editor/engine/brushes/presets";
import type { BrushPresetId } from "../../editor/model/types";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectBrushPresetId } from "../../editor/store/selectors";
import { BRUSH_ICONS } from "./brushIcons";
import styles from "./BrushLibrary.module.css";

const SECTIONS: { kind: BrushKind; title: string }[] = [
  { kind: "draw", title: "Dibujo" },
  { kind: "eraser", title: "Borradores" },
];

/**
 * Lista de presets de pincel, por secciones. Elegir uno lo activa y avisa a
 * quien la muestra (p. ej. para cerrar la hoja).
 */
const BrushLibrary = ({ onSelect }: { onSelect?: () => void }) => {
  const currentId = useEditorStore(selectBrushPresetId);
  const setBrushPreset = useEditorStore((state) => state.setBrushPreset);

  const choose = (id: BrushPresetId) => {
    setBrushPreset(id);
    onSelect?.();
  };

  return (
    <div className={styles.library}>
      {SECTIONS.map(({ kind, title }) => (
        <section key={kind} aria-label={title}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.grid}>
            {BRUSH_PRESET_IDS.filter(
              (id) => BRUSH_PRESETS[id].kind === kind
            ).map((id) => {
              const Icon = BRUSH_ICONS[id];
              return (
                <Button
                  key={id}
                  className={styles.preset}
                  aria-pressed={id === currentId}
                  onClick={() => choose(id)}
                >
                  <Icon aria-hidden="true" className={styles.icon} />
                  <span>{BRUSH_PRESETS[id].name}</span>
                </Button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default BrushLibrary;
