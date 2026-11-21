import {
  BrushCleaning,
  Download,
  EllipsisVertical,
  House,
  Keyboard,
  Layers,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useUiStore } from "../../../app/uiStore";
import { IconButton } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/Dialog";
import { Menu, type MenuItem } from "../../../components/ui/Menu";
import { Panel } from "../../../components/ui/Panel";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectCanRedo, selectCanUndo } from "../../../editor/store/selectors";
import { classNames } from "../../../lib/classNames";
import { HOVER_QUERY, useMediaQuery } from "../../../lib/useMediaQuery";
import { BackdropPanel } from "../../backdrop";
import { ExportDialog } from "../../export";
import { SHORTCUT_LABELS } from "../../shortcuts";
import { UpdateButton } from "../../update";
import styles from "./EditorHeader.module.css";

/**
 * Cabecera del editor. Es transparente y flota sobre el lienzo: cada grupo de
 * botones lleva su propio fondo, como la barra inferior. Se oculta con las
 * barras (menú de la vista → "Ocultar las barras").
 * - a la izquierda, deshacer y rehacer;
 * - en el centro, lo que pase el shell (en escritorio, el selector de modo);
 * - a la derecha, "Actualizar" (solo si hay una versión nueva de la app), el
 *   fondo (siempre a la vista) y el menú ⋮, con Exportar
 *   (también Ctrl/⌘ + S), volver al inicio (el documento se conserva), los
 *   atajos, borrar el dibujo (se puede deshacer) y borrar todo definitivamente
 *   (también el fondo de color y el historial).
 */
const EditorHeader = ({ center }: { center?: ReactNode }) => {
  const hasContent = useEditorStore((state) => state.log.length > 0);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const isExporting = useEditorStore(
    (state) => state.status === "exporting" || state.status === "exportingVideo"
  );
  const setMode = useEditorStore((state) => state.setMode);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const clearLog = useEditorStore((state) => state.clearLog);
  const resetDrawing = useEditorStore((state) => state.resetDrawing);
  // Algo que borrar para siempre: dibujo, capa de color o historial.
  const hasAnythingToReset = useEditorStore(
    (state) =>
      state.log.length > 0 ||
      state.backdrop.fill !== null ||
      state.past.length > 0 ||
      state.future.length > 0
  );

  const isExportOpen = useUiStore((state) => state.dialog === "export");
  const openDialog = useUiStore((state) => state.openDialog);
  const closeDialog = useUiStore((state) => state.closeDialog);
  const areBarsHidden = useUiStore((state) => state.areBarsHidden);
  // Los atajos solo tienen sentido con teclado y ratón (no en el móvil).
  const hasKeyboard = useMediaQuery(HOVER_QUERY);

  const [isBackdropOpen, setIsBackdropOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      label: isExporting ? "Exportando…" : "Exportar",
      icon: Download,
      disabled: isExporting,
      onSelect: () => openDialog("export"),
    },
    {
      label: "Volver al inicio",
      icon: House,
      onSelect: () => setMode("home"),
    },
    ...(hasKeyboard
      ? [
          {
            label: "Atajos de teclado",
            icon: Keyboard,
            onSelect: () => openDialog("shortcuts"),
          },
        ]
      : []),
    {
      label: "Borrar el dibujo",
      icon: Trash2,
      isDanger: true,
      disabled: !hasContent,
      onSelect: () => setIsClearOpen(true),
    },
    {
      label: "Borrar todo definitivamente",
      icon: BrushCleaning,
      isDanger: true,
      disabled: !hasAnythingToReset,
      onSelect: () => setIsResetOpen(true),
    },
  ];

  return (
    <header
      className={styles.header}
      data-hidden={areBarsHidden || undefined}
      // Oculta: fuera del orden de Tab y de los lectores de pantalla.
      inert={areBarsHidden}
    >
      <div className={classNames(styles.start, styles.group)}>
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

      {center && (
        <div className={classNames(styles.center, styles.group)}>{center}</div>
      )}

      <div className={styles.end}>
        <UpdateButton />
        <div className={styles.group}>
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
            items={menuItems}
          />
        </div>
      </div>

      <Panel
        open={isBackdropOpen}
        onOpenChange={setIsBackdropOpen}
        title="Fondo"
        icon={Layers}
      >
        <BackdropPanel />
      </Panel>
      <ExportDialog
        open={isExportOpen}
        onOpenChange={(open) => (open ? openDialog("export") : closeDialog())}
      />
      <ConfirmDialog
        open={isClearOpen}
        onOpenChange={setIsClearOpen}
        title="¿Borrar el dibujo?"
        description="Se borrará lo que hayas hecho con las barras de dibujo y de texto. Podrás recuperarlo con Deshacer."
        confirmLabel="Borrar"
        isDestructive
        onConfirm={clearLog}
      />
      <ConfirmDialog
        open={isResetOpen}
        onOpenChange={setIsResetOpen}
        title="¿Borrar todo definitivamente?"
        description="Se borrará toda la edición, también el fondo de color. No podrás recuperar nada."
        confirmLabel="Borrar todo"
        isDestructive
        onConfirm={resetDrawing}
      />
    </header>
  );
};

export default EditorHeader;
