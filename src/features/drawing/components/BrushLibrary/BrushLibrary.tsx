import { EllipsisVertical } from "lucide-react";
import { Button, IconButton } from "../../../../components/ui/Button";
import { CardSection } from "../../../../components/ui/CardSection";
import { ChoiceMenu } from "../../../../components/ui/Menu";
import {
  BRUSH_PRESETS,
  BRUSH_PRESET_IDS,
  usesStampShape,
  type BrushKind,
} from "../../../../editor/engine/brushes/presets";
import type { StampShape } from "../../../../editor/model/types";
import { useEditorStore } from "../../../../editor/store/editorStore";
import {
  selectBrushPresetId,
  selectBrushShape,
} from "../../../../editor/store/selectors";
import { BRUSH_ICONS } from "../../constants/brushIcons";
import styles from "./BrushLibrary.module.css";
import BrushPreview from "../BrushPreview/BrushPreview";
import BrushSettingsPanel from "../BrushSettingsPanel/BrushSettingsPanel";
import { STAMP_SHAPE_OPTIONS } from "../../constants/stampShapes";

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
 *
 * El pincel de formas tiene además un botón de "más opciones" en su tarjeta
 * para elegir la figura que estampa.
 */
const BrushLibrary = () => {
  const currentId = useEditorStore(selectBrushPresetId);
  const shape = useEditorStore(selectBrushShape);
  const setBrushPreset = useEditorStore((state) => state.setBrushPreset);
  const setBrushShape = useEditorStore((state) => state.setBrushShape);

  return (
    <div className={styles.library}>
      <BrushSettingsPanel />
      {SECTIONS.map(({ kind, title }) => (
        <CardSection
          key={kind}
          title={title}
          headingLevel={3}
          titleClassName={styles.title}
          gridClassName={styles.grid}
        >
          {BRUSH_PRESET_IDS.filter((id) => BRUSH_PRESETS[id].kind === kind).map(
            (id) => {
              const Icon = BRUSH_ICONS[id];
              const { name } = BRUSH_PRESETS[id];
              const card = (
                <Button
                  key={id}
                  className={styles.preset}
                  aria-pressed={id === currentId}
                  onClick={() => setBrushPreset(id)}
                >
                  <BrushPreview presetId={id} />
                  <span className={styles.name}>
                    <Icon aria-hidden="true" className={styles.icon} />
                    {name}
                  </span>
                </Button>
              );
              if (!usesStampShape(id)) return card;
              // El botón de opciones va al lado de la tarjeta, no dentro: un
              // botón no puede contener otro.
              return (
                <div key={id} className={styles.card}>
                  {card}
                  <ChoiceMenu
                    trigger={
                      <IconButton
                        icon={EllipsisVertical}
                        aria-label={`Más opciones de ${name}`}
                        title="Más opciones"
                        className={styles.more}
                      />
                    }
                    label="Forma"
                    value={shape}
                    onChange={(next: StampShape) => {
                      setBrushShape(next);
                      // Elegir una figura es querer pintar con ella.
                      setBrushPreset(id);
                    }}
                    options={STAMP_SHAPE_OPTIONS}
                  />
                </div>
              );
            }
          )}
        </CardSection>
      ))}
    </div>
  );
};

export default BrushLibrary;
