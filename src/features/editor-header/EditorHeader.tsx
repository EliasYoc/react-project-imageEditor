import {
  Download,
  EllipsisVertical,
  Layers,
  Redo2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Dialog";
import { Menu } from "../../components/ui/Menu";
import { Panel } from "../../components/ui/Panel";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectCanRedo, selectCanUndo } from "../../editor/store/selectors";
import BackdropPanel from "../backdrop/BackdropPanel";
import ExportDialog from "../export/ExportDialog";
import { SHORTCUT_LABELS } from "../shortcuts/shortcutLabels";
import styles from "./EditorHeader.module.css";

/**
 * Cabecera del editor:
 * - a la izquierda, volver al inicio (el documento se conserva), deshacer y
 *   rehacer;
 * - en el centro, lo que pase el shell (en escritorio, el selector de modo);
 * - a la derecha, el fondo (siempre a la vista, antes escondido en ⋮), el
 *   menú ⋮ y la acción principal: Exportar.
 */
const EditorHeader = ({ center }: { center?: ReactNode }) => {
  const hasContent = useEditorStore((state) => state.log.length > 0);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const isExporting = useEditorStore((state) => state.status === "exporting");
  const setMode = useEditorStore((state) => state.setMode);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const clearLog = useEditorStore((state) => state.clearLog);

  const [isBackdropOpen, setIsBackdropOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.start}>
        <IconButton
          icon={X}
          aria-label="Cerrar el editor"
          title="Volver al inicio"
          onClick={() => setMode("home")}
        />
        {/* Siempre visibles (deshabilitados si no hay nada): así los botones
            no cambian de sitio mientras se dibuja. */}
        <IconButton
          icon={Undo2}
          aria-label="Deshacer"
          shortcut={SHORTCUT_LABELS.undo}
          disabled={!canUndo}
          onClick={undo}
        />
        <IconButton
          icon={Redo2}
          aria-label="Rehacer"
          shortcut={SHORTCUT_LABELS.redo}
          disabled={!canRedo}
          onClick={redo}
        />
      </div>

      {center && <div className={styles.center}>{center}</div>}

      <div className={styles.end}>
        <IconButton
          icon={Layers}
          aria-label="Fondo"
          title="Color o degradado de fondo"
          aria-haspopup="dialog"
          onClick={() => setIsBackdropOpen(true)}
        />
        <Menu
          trigger={
            <IconButton icon={EllipsisVertical} aria-label="Más opciones" />
          }
          items={[
            {
              label: "Borrar el dibujo",
              icon: Trash2,
              danger: true,
              disabled: !hasContent,
              onSelect: () => setIsClearOpen(true),
            },
          ]}
        />
        <Button
          variant="primary"
          size="sm"
          className={styles.export}
          aria-label="Exportar"
          aria-haspopup="dialog"
          disabled={isExporting}
          onClick={() => setIsExportOpen(true)}
        >
          <Download aria-hidden="true" />
          <span className={styles.exportLabel}>
            {isExporting ? "Exportando…" : "Exportar"}
          </span>
        </Button>
      </div>

      <Panel
        open={isBackdropOpen}
        onOpenChange={setIsBackdropOpen}
        title="Fondo"
      >
        <BackdropPanel />
      </Panel>
      <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} />
      <ConfirmDialog
        open={isClearOpen}
        onOpenChange={setIsClearOpen}
        title="¿Borrar el dibujo?"
        description="Se quitan los trazos, los textos y las imágenes (la foto y el fondo se quedan). Puedes recuperarlo con Deshacer."
        confirmLabel="Borrar"
        destructive
        onConfirm={clearLog}
      />
    </header>
  );
};

export default EditorHeader;
