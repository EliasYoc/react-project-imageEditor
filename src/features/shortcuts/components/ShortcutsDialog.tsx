import {
  Bold,
  Brush,
  CircleDot,
  Download,
  EyeOff,
  Hand,
  Keyboard,
  Mouse,
  Play,
  Redo2,
  Scan,
  SquareDashed,
  TextCursorInput,
  Trash2,
  Undo2,
  ZoomIn,
} from "lucide-react";
import { useUiStore } from "../../../app/uiStore";
import type { IconComponent } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { Kbd } from "../../../components/ui/Kbd";
import { Section } from "../../../components/ui/Section";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectHasVideo } from "../../../editor/store/selectors";
import { MOD_KEY, SHORTCUT_LABELS as KEYS } from "../constants/shortcutLabels";
import styles from "./ShortcutsDialog.module.css";

interface ShortcutGroup {
  title: string;
  /**
   * Cada atajo con su icono: el de su botón cuando lo tiene (deshacer,
   * exportar, zoom…); si no, uno de lucide que lo explique (la rueda, la mano
   * para desplazar…).
   */
  items: [action: string, keys: string, icon: IconComponent][];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    items: [
      ["Deshacer", KEYS.undo, Undo2],
      ["Rehacer", `${KEYS.redo} · ${MOD_KEY}+Y`, Redo2],
      ["Exportar", KEYS.export, Download],
      ["Esta lista", KEYS.showShortcuts, Keyboard],
    ],
  },
  {
    title: "Vista",
    items: [
      ["Acercar / alejar", `${KEYS.zoomIn} · ${KEYS.zoomOut}`, ZoomIn],
      ["Zoom con la rueda", `${MOD_KEY}+rueda`, Mouse],
      ["Ajustar a la pantalla", KEYS.fit, Scan],
      ["Ocultar / mostrar las barras", KEYS.toggleBars, EyeOff],
      ["Desplazar", "Espacio + arrastrar", Hand],
    ],
  },
  {
    title: "Dibujar",
    items: [
      ["Pincel / borrador", `${KEYS.drawBrush} · ${KEYS.eraser}`, Brush],
      ["Tamaño del pincel", KEYS.brushSize, CircleDot],
    ],
  },
  {
    title: "Texto",
    items: [
      ["Editar un texto", "Doble clic", TextCursorInput],
      ["Negrita", KEYS.bold, Bold],
      ["Eliminar el elemento", KEYS.deleteElement, Trash2],
      ["Quitar la selección", KEYS.deselect, SquareDashed],
    ],
  },
];

/** Solo aparece con un video abierto. */
const VIDEO_GROUP: ShortcutGroup = {
  title: "Video",
  items: [["Reproducir / pausar", KEYS.togglePlayback, Play]],
};

/** Lista de atajos de teclado (se abre con "?" o desde el menú ⋮). */
const ShortcutsDialog = () => {
  const isOpen = useUiStore((state) => state.dialog === "shortcuts");
  const closeDialog = useUiStore((state) => state.closeDialog);
  const hasVideo = useEditorStore(selectHasVideo);
  const groups = hasVideo ? [...GROUPS, VIDEO_GROUP] : GROUPS;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && closeDialog()}
      title="Atajos de teclado"
      icon={Keyboard}
    >
      <div className={styles.groups}>
        {groups.map(({ title, items }) => (
          <Section key={title} title={title} className={styles.group}>
            <dl className={styles.list}>
              {items.map(([action, keys, Icon]) => (
                <div key={action} className={styles.row}>
                  <dt className={styles.action}>
                    <Icon aria-hidden="true" />
                    {action}
                  </dt>
                  <dd>
                    <Kbd>{keys}</Kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        ))}
      </div>
    </Dialog>
  );
};

export default ShortcutsDialog;
