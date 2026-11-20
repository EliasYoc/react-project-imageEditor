import { Suspense, lazy, useState, type FormEvent } from "react";
import { Button } from "../../../../components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogClose,
} from "../../../../components/ui/Dialog";
import {
  Segmented,
  type SegmentedItem,
} from "../../../../components/ui/Segmented";
import { toast } from "../../../../components/ui/Toast";
import { useEditorStore } from "../../../../editor/store/editorStore";
import { selectHasAnimatedElements } from "../../../../editor/store/selectors";
import { fitVideoSize } from "../../../../lib/videoSize";
import { ANIMATION_VIDEO_SECONDS } from "../../constants/animationVideo";
import { exportImage } from "../../utils/exportImage";
import styles from "./ExportDialog.module.css";
import { defaultExportName, exportExtension } from "../../utils/exportName";
import FileNameField from "../FileNameField/FileNameField";

/**
 * El diálogo de exportar un video va en su propio archivo de JavaScript: solo
 * se descarga con un video abierto (el editor no lo carga para una foto).
 */
const VideoExportDialog = lazy(
  () => import("../VideoExportDialog/VideoExportDialog")
);
/** El video de un lienzo con GIFs se exporta igual: va en el mismo archivo. */
const AnimationExportBody = lazy(() =>
  import("../VideoExportDialog/VideoExportDialog").then((module) => ({
    default: module.AnimationExportBody,
  }))
);

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Exportar el documento: una imagen; si el fondo es un video, ese video con
 * el dibujo encima (`VideoExportDialog`); y si es un lienzo o una foto con
 * GIFs, a elegir entre imagen y video (`AnimatedExportDialog`).
 */
const ExportDialog = (props: ExportDialogProps) => {
  const isVideo = useEditorStore((state) => state.photo.video !== null);
  const hasAnimation = useEditorStore(selectHasAnimatedElements);
  if (isVideo) {
    return (
      // Se pide al abrir el video, no al pulsar Exportar: para entonces ya está.
      <Suspense fallback={null}>
        <VideoExportDialog {...props} />
      </Suspense>
    );
  }
  return hasAnimation ? (
    <AnimatedExportDialog {...props} />
  ) : (
    <ImageExportDialog {...props} />
  );
};

/** Cómo se guarda la imagen: a la resolución de la foto o del lienzo. */
const useImageDescription = () => {
  const hasPhoto = useEditorStore((state) => state.photo.source !== null);
  const { width, height } = useEditorStore((state) => state.canvasSize);
  return hasPhoto
    ? "Se guarda a la resolución de la foto original."
    : `Se guarda a ${width} × ${height} px.`;
};

/**
 * Pide el nombre del archivo (ya relleno) y exporta. La imagen sale con el
 * formato de la foto original (o PNG si no hay foto); en el móvil se abre la
 * hoja de compartir.
 */
const ImageExportDialog = ({ open, onOpenChange }: ExportDialogProps) => (
  <Dialog
    open={open}
    onOpenChange={onOpenChange}
    title="Exportar imagen"
    description={useImageDescription()}
  >
    {/* Se monta al abrir: cada vez empieza con el nombre sugerido. */}
    <ExportForm onDone={() => onOpenChange(false)} />
  </Dialog>
);

type ExportKind = "image" | "video";

const EXPORT_KINDS: readonly SegmentedItem<ExportKind>[] = [
  { value: "image", label: "Imagen" },
  { value: "video", label: "Video" },
];

/** Al abrir el diálogo: con GIFs, lo normal es querer que se muevan. */
const DEFAULT_KIND: ExportKind = "video";

/**
 * Exportar un lienzo o una foto con GIFs: como imagen (el fotograma que se
 * ve) o como video de `ANIMATION_VIDEO_SECONDS` segundos con los GIFs
 * moviéndose. Mientras se exporta el video no se puede cambiar de opción ni
 * cerrar el diálogo.
 */
const AnimatedExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const [kind, setKind] = useState<ExportKind>(DEFAULT_KIND);
  const [isWorking, setIsWorking] = useState(false);
  const imageDescription = useImageDescription();
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const videoSize = fitVideoSize(canvasSize);

  const changeOpen = (next: boolean) => {
    if (next) return onOpenChange(true);
    if (isWorking) return;
    // La próxima vez vuelve a empezar en la opción de siempre.
    setKind(DEFAULT_KIND);
    onOpenChange(false);
  };
  const close = () => changeOpen(false);

  const isVideo = kind === "video";
  return (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      title={isVideo ? "Exportar video" : "Exportar imagen"}
      description={
        isVideo
          ? `Se guarda en MP4 a ${videoSize.width} × ${videoSize.height} px, ${ANIMATION_VIDEO_SECONDS} segundos, sin sonido.`
          : imageDescription
      }
    >
      {!isWorking && (
        <Segmented
          label="Exportar como"
          value={kind}
          onChange={setKind}
          items={EXPORT_KINDS}
        />
      )}
      {isVideo ? (
        <Suspense fallback={null}>
          <AnimationExportBody onDone={close} onWorkingChange={setIsWorking} />
        </Suspense>
      ) : (
        <ExportForm onDone={close} />
      )}
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
