import { Suspense, lazy, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogClose,
} from "../../../components/ui/Dialog";
import { toast } from "../../../components/ui/Toast";
import { useEditorStore } from "../../../editor/store/editorStore";
import { exportImage } from "../utils/exportImage";
import styles from "./ExportDialog.module.css";
import { defaultExportName, exportExtension } from "../utils/exportName";
import FileNameField from "./FileNameField";

/**
 * El diálogo de exportar un video va en su propio archivo de JavaScript: solo
 * se descarga con un video abierto (el editor no lo carga para una foto).
 */
const VideoExportDialog = lazy(() => import("./VideoExportDialog"));

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Exportar el documento: una imagen o, si el fondo es un video, ese video
 * con el dibujo encima (`VideoExportDialog`).
 */
const ExportDialog = (props: ExportDialogProps) => {
  const isVideo = useEditorStore((state) => state.photo.video !== null);
  return isVideo ? (
    // Se pide al abrir el video, no al pulsar Exportar: para entonces ya está.
    <Suspense fallback={null}>
      <VideoExportDialog {...props} />
    </Suspense>
  ) : (
    <ImageExportDialog {...props} />
  );
};

/**
 * Pide el nombre del archivo (ya relleno) y exporta. La imagen sale con el
 * formato de la foto original (o PNG si no hay foto); en el móvil se abre la
 * hoja de compartir.
 */
const ImageExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
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
      <FileNameField value={name} onChange={setName} extension={extension} />
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
