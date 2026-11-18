import { Progress } from "radix-ui";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogClose,
} from "../../../components/ui/Dialog";
import { toast } from "../../../components/ui/Toast";
import { useEditorStore } from "../../../editor/store/editorStore";
import { getDownloadFileName } from "../../../lib/helper";
import { saveImage, sharesFile } from "../../../lib/saveImage";
import {
  VIDEO_EXTENSION,
  VIDEO_MIME_TYPE,
  defaultExportName,
} from "../utils/exportName";
import { exportVideo } from "../utils/exportVideo";
import type { ExportDialogProps } from "./ExportDialog";
import styles from "./ExportDialog.module.css";
import FileNameField from "./FileNameField";

/** Un video ya exportado, a falta de entregarlo. */
interface ReadyVideo {
  blob: Blob;
  fileName: string;
}

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
      description={`Se guarda en MP4 a ${width} × ${height} px, con su sonido.`}
    >
      {/* Se monta al abrir: cada vez empieza con el nombre sugerido. */}
      <VideoExportBody
        onDone={() => onOpenChange(false)}
        onWorkingChange={setIsWorking}
      />
    </Dialog>
  );
};

interface VideoExportBodyProps {
  onDone: () => void;
  onWorkingChange: (isWorking: boolean) => void;
}

const VideoExportBody = ({ onDone, onWorkingChange }: VideoExportBodyProps) => {
  const fileName = useEditorStore((state) => state.photo.fileName);
  const setStatus = useEditorStore((state) => state.setStatus);
  const suggested = () =>
    defaultExportName({ hasPhoto: false, isVideo: true, fileName });
  const [name, setName] = useState(suggested);
  /** null = aún no se ha empezado; después, el avance de 0 a 100. */
  const [percent, setPercent] = useState<number | null>(null);
  const [ready, setReady] = useState<ReadyVideo | null>(null);
  const controller = useRef<AbortController | null>(null);
  const progressId = useId();

  // Si el diálogo desaparece a media exportación, se cancela.
  useEffect(() => () => controller.current?.abort(), []);

  /** Entrega el video. `false` si el usuario cerró la hoja de compartir. */
  const deliver = async ({ blob, fileName }: ReadyVideo) => {
    const result = await saveImage(blob, fileName);
    if (result === "cancelled") return false;
    // Con la hoja de compartir del móvil, el sistema ya da su respuesta.
    if (result === "downloaded") {
      toast.success(`Video descargado: ${fileName}`);
    }
    return true;
  };

  const run = async () => {
    const abort = new AbortController();
    controller.current = abort;
    setPercent(0);
    onWorkingChange(true);
    setStatus("exportingVideo");
    try {
      return await exportVideo({
        onProgress: (progress) => setPercent(Math.round(progress * 100)),
        signal: abort.signal,
      });
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      controller.current = null;
      setStatus("idle");
      onWorkingChange(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const savedName = getDownloadFileName(
      name.trim() || suggested(),
      VIDEO_MIME_TYPE
    );
    const result = await run();
    if (!result) {
      toast.error("No se pudo exportar el video");
      return onDone();
    }
    if (result.status === "canceled") return onDone();
    if (result.status === "unsupported") {
      toast.error("Este navegador no puede exportar este video");
      return onDone();
    }
    if (result.hasLostSound) toast.error("El video se exportó sin sonido");

    const video = { blob: result.blob, fileName: savedName };
    // La hoja de compartir del móvil exige que el usuario acabe de tocar
    // algo, y la exportación puede haber tardado más que eso: entonces se
    // muestra un botón para abrirla con un toque nuevo.
    const needsTap =
      sharesFile(video.blob, video.fileName) &&
      !navigator.userActivation?.isActive;
    if (needsTap) {
      setPercent(null);
      setReady(video);
      return;
    }
    await deliver(video);
    onDone();
  };

  if (ready) {
    return (
      <div className={styles.form}>
        <p className={styles.status}>El video está listo.</p>
        <DialogActions>
          <DialogClose asChild>
            <Button size="sm">Cerrar</Button>
          </DialogClose>
          <Button
            size="sm"
            variant="primary"
            onClick={async () => {
              if (await deliver(ready)) onDone();
            }}
          >
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
        <Progress.Root
          className={styles.progress}
          value={percent}
          aria-labelledby={progressId}
        >
          <Progress.Indicator
            className={styles.progressFill}
            style={{ width: `${percent}%` }}
          />
        </Progress.Root>
        <DialogActions>
          <Button size="sm" onClick={() => controller.current?.abort()}>
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
