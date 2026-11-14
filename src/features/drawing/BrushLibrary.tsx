import { Button } from "../../components/ui/Button";
import {
  BRUSH_PRESETS,
  BRUSH_PRESET_IDS,
  type BrushKind,
} from "../../editor/engine/brushes/presets";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectBrushPresetId } from "../../editor/store/selectors";
import { BRUSH_ICONS } from "./brushIcons";
import styles from "./BrushLibrary.module.css";
import BrushPreview from "./BrushPreview";
import BrushSettingsPanel from "./BrushSettingsPanel";

const SECTIONS: { kind: BrushKind; title: string }[] = [
  { kind: "draw", title: "Dibujo" },
  { kind: "eraser", title: "Borradores" },
];

/**
 * Biblioteca de pinceles: los ajustes del pincel actual y, debajo, todos los
 * presets por secciones con una vista previa real de su trazo.
 *
 * Elegir un preset no cierra la hoja: así se pueden probar varios y ajustar
 * el elegido sin volver a abrirla.
 */
const BrushLibrary = () => {
  const currentId = useEditorStore(selectBrushPresetId);
  const setBrushPreset = useEditorStore((state) => state.setBrushPreset);

  return (
    <div className={styles.library}>
      <BrushSettingsPanel />
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
                  onClick={() => setBrushPreset(id)}
                >
                  <BrushPreview presetId={id} />
                  <span className={styles.name}>
                    <Icon aria-hidden="true" className={styles.icon} />
                    {BRUSH_PRESETS[id].name}
                  </span>
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
