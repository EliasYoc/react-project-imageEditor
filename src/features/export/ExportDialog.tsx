import { useId, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Dialog, DialogActions, DialogClose } from "../../components/ui/Dialog";
import { toast } from "../../components/ui/Toast";
import { useEditorStore } from "../../editor/store/editorStore";
import { exportImage } from "./exportImage";
import styles from "./ExportDialog.module.css";
import { defaultExportName, exportExtension } from "./exportName";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Pide el nombre del archivo (ya relleno) y exporta. La imagen sale con el
 * formato de la foto original (o PNG si no hay foto); en el móvil se abre la
 * hoja de compartir.
 */
const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const hasPhoto = useEditorStore((state) => state.photo.source !== null);
  const { width, height } = useEditorStore((state) => state.canvasSize);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Exportar imagen"
      description={
        hasPhoto
          ? "Se guarda a la resolución de la foto original."
          : `Se guarda a ${width} × ${height} px.`
      }
    >
      {/* Se monta al abrir: cada vez empieza con el nombre sugerido. */}
      <ExportForm onDone={() => onOpenChange(false)} />
    </Dialog>
  );
};

const ExportForm = ({ onDone }: { onDone: () => void }) => {
  const hasPhoto = useEditorStore((state) => state.photo.source !== null);
  const mimeType = useEditorStore((state) => state.photo.mimeType);
  const fileName = useEditorStore((state) => state.photo.fileName);
  const suggested = () => defaultExportName({ hasPhoto, fileName });
  const setStatus = useEditorStore((state) => state.setStatus);
  const [name, setName] = useState(suggested);
  const inputId = useId();
  const extension = exportExtension(hasPhoto ? mimeType : null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const exportName = name.trim() || suggested();
    onDone();
    setStatus("exporting");
    try {
      const saved = await exportImage({ fileName: exportName });
      // Con la hoja de compartir del móvil, el sistema ya da su respuesta.
      if (saved.result === "downloaded") {
        toast.success(`Imagen descargada: ${saved.fileName}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo exportar la imagen");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label htmlFor={inputId} className={styles.label}>
        Nombre del archivo
      </label>
      <div className={styles.field}>
        <input
          id={inputId}
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          autoComplete="off"
          spellCheck={false}
        />
        <span className={styles.extension} aria-hidden="true">
          .{extension}
        </span>
      </div>
      <DialogActions>
        <DialogClose asChild>
          <Button size="sm">Cancelar</Button>
        </DialogClose>
        <Button type="submit" size="sm" variant="primary">
          Exportar
        </Button>
      </DialogActions>
    </form>
  );
};

export default ExportDialog;
