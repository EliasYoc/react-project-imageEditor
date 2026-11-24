import { Download } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { ProgressBar } from "../../../../components/ui/ProgressBar";
import { Button } from "../../../../components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogClose,
} from "../../../../components/ui/Dialog";
import { useEditorStore } from "../../../../editor/store/editorStore";
import { selectHasPhoto } from "../../../../editor/store/selectors";
import { getDownloadFileName } from "../../../../lib/helper";
import {
  VIDEO_EXTENSION,
  VIDEO_MIME_TYPE,
  defaultExportName,
} from "../../utils/exportName";
import type { EncodeVideoResult } from "../../utils/encodeVideo";
import {
  exportAnimation,
  exportVideo,
  type ExportVideoOptions,
} from "../../utils/exportVideo";
import { useVideoExport } from "../../hooks/useVideoExport";
import type { ExportDialogProps } from "../ExportDialog/ExportDialog";
import styles from "./VideoExportDialog.module.css";
import FileNameField from "../FileNameField/FileNameField";

/**
 * Exporta el video del documento en MP4. A diferencia de una imagen, tarda:
 * el diálogo se queda abierto con el avance y un botón para cancelar, y
 * mientras tanto no se cierra con Escape ni tocando fuera.
 */
const VideoExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const { width, height } = useEditorStore((state) => state.canvasSize);
  const [isWorking, setIsWorking] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next || !isWorking) onOpenChange(next);
      }}
      title="Exportar video"
      icon={Download}
      description={`Se guarda en MP4 a ${width} × ${height} px, con su sonido.`}
    >
      {/* Se monta al abrir: cada vez empieza con el nombre sugerido. */}
      <DocumentVideoExportBody
        onDone={() => onOpenChange(false)}
        onWorkingChange={setIsWorking}
      />
    </Dialog>
  );
};

interface ExportBodyProps {
  onDone: () => void;
  onWorkingChange: (isWorking: boolean) => void;
}

/** Exportar el video del documento, con el dibujo encima y su sonido. */
const DocumentVideoExportBody = (props: ExportBodyProps) => {
  const fileName = useEditorStore((state) => state.photo.fileName);
  return (
    <VideoExportBody
      {...props}
      runExport={exportVideo}
      suggestedName={defaultExportName({
        hasPhoto: false,
        isVideo: true,
        fileName,
      })}
    />
  );
};

/**
 * Exportar un lienzo o una foto con GIFs como video (lo usa `ExportDialog`,
 * que lo carga bajo demanda desde este archivo).
 */
export const AnimationExportBody = (props: ExportBodyProps) => {
  const hasPhoto = useEditorStore(selectHasPhoto);
  const fileName = useEditorStore((state) => state.photo.fileName);
  return (
    <VideoExportBody
      {...props}
      runExport={exportAnimation}
      suggestedName={defaultExportName({ hasPhoto, fileName })}
    />
  );
};

interface VideoExportBodyProps extends ExportBodyProps {
  /** Exporta el video y dice cómo terminó. */
  runExport: (options: ExportVideoOptions) => Promise<EncodeVideoResult>;
  /** El nombre que se propone (y el que se usa si se deja vacío). */
  suggestedName: string;
}

const VideoExportBody = ({
  onDone,
  onWorkingChange,
  runExport,
  suggestedName,
}: VideoExportBodyProps) => {
  const [name, setName] = useState(suggestedName);
  const progressId = useId();
  const { percent, ready, exportAs, cancel, deliverReady } = useVideoExport({
    runExport,
    onDone,
    onWorkingChange,
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void exportAs(
      getDownloadFileName(name.trim() || suggestedName, VIDEO_MIME_TYPE)
    );
  };

  if (ready) {
    return (
      <div className={styles.form}>
        <p className={styles.status}>El video está listo.</p>
        <DialogActions>
          <DialogClose asChild>
            <Button size="sm">Cerrar</Button>
          </DialogClose>
          <Button size="sm" variant="primary" onClick={deliverReady}>
            Compartir o guardar
          </Button>
        </DialogActions>
      </div>
    );
  }

  if (percent !== null) {
    return (
      <div className={styles.form}>
        <p id={progressId} className={styles.status}>
          Exportando el video… {percent} %
        </p>
        <ProgressBar value={percent} aria-labelledby={progressId} />
        <DialogActions>
          <Button size="sm" onClick={cancel}>
            Cancelar
          </Button>
        </DialogActions>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FileNameField
        value={name}
        onChange={setName}
        extension={VIDEO_EXTENSION}
      />
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

export default VideoExportDialog;
