import { useUiStore } from "../../../app/uiStore";
import { Dialog } from "../../../components/ui/Dialog";
import { Kbd } from "../../../components/ui/Kbd";
import { useEditorStore } from "../../../editor/store/editorStore";
import { MOD_KEY, SHORTCUT_LABELS as KEYS } from "../constants/shortcutLabels";
import styles from "./ShortcutsDialog.module.css";

interface ShortcutGroup {
  title: string;
  items: [action: string, keys: string][];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    items: [
      ["Deshacer", KEYS.undo],
      ["Rehacer", `${KEYS.redo} · ${MOD_KEY}+Y`],
      ["Exportar", KEYS.export],
      ["Esta lista", KEYS.showShortcuts],
    ],
  },
  {
    title: "Vista",
    items: [
      ["Acercar / alejar", `${KEYS.zoomIn} · ${KEYS.zoomOut}`],
      ["Zoom con la rueda", `${MOD_KEY}+rueda`],
      ["Ajustar a la pantalla", KEYS.fit],
      ["Ocultar / mostrar las barras", KEYS.toggleBars],
      ["Desplazar", "Espacio + arrastrar"],
    ],
  },
  {
    title: "Dibujar",
    items: [
      ["Pincel / borrador", `${KEYS.drawBrush} · ${KEYS.eraser}`],
      ["Tamaño del pincel", KEYS.brushSize],
    ],
  },
  {
    title: "Texto",
    items: [
      ["Editar un texto", "Doble clic"],
      ["Negrita", KEYS.bold],
      ["Eliminar el elemento", KEYS.deleteElement],
      ["Quitar la selección", KEYS.deselect],
    ],
  },
];

/** Solo aparece con un video abierto. */
const VIDEO_GROUP: ShortcutGroup = {
  title: "Video",
  items: [["Reproducir / pausar", KEYS.togglePlayback]],
};

/** Lista de atajos de teclado (se abre con "?" o desde el menú ⋮). */
const ShortcutsDialog = () => {
  const isOpen = useUiStore((state) => state.dialog === "shortcuts");
  const closeDialog = useUiStore((state) => state.closeDialog);
  const hasVideo = useEditorStore((state) => state.photo.video !== null);
  const groups = hasVideo ? [...GROUPS, VIDEO_GROUP] : GROUPS;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && closeDialog()}
      title="Atajos de teclado"
    >
      <div className={styles.groups}>
        {groups.map(({ title, items }) => (
          <section key={title} aria-label={title}>
            <h3 className={styles.groupTitle}>{title}</h3>
            <dl className={styles.list}>
              {items.map(([action, keys]) => (
                <div key={action} className={styles.row}>
                  <dt>{action}</dt>
                  <dd>
                    <Kbd>{keys}</Kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  );
};

export default ShortcutsDialog;
