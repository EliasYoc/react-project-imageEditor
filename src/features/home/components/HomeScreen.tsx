import { ArrowRight, ImagePlus, Video } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { CardSection } from "../../../components/ui/CardSection";
import { ConfirmDialog } from "../../../components/ui/Dialog";
import { toast } from "../../../components/ui/Toast";
import { classNames } from "../../../lib/classNames";
import { IMAGE_OPEN_ERROR_MESSAGE } from "../../../lib/messages";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectHasDocumentContent } from "../../../editor/store/selectors";
import { useFilePicker } from "../../../lib/useFilePicker";
import { HOVER_QUERY, useMediaQuery } from "../../../lib/useMediaQuery";
import { MOD_KEY } from "../../shortcuts";
import styles from "./HomeScreen.module.css";
import { CANVAS_SECTIONS } from "../constants/canvasPresets";
import { NETWORK_ICONS } from "../constants/networkIcons";
import { openImageFile } from "../utils/openImageFile";
import { openVideoFile, VideoOpenError } from "../utils/openVideoFile";
import { useImageDropAndPaste } from "../hooks/useImageDrop";

/** La forma del lienzo dibujada en un cuadro de SHAPE_BOX px. */
const SHAPE_BOX = 36;
const shapeStyle = (width: number, height: number) => {
  const scale = SHAPE_BOX / Math.max(width, height);
  return { width: width * scale, height: height * scale };
};

/**
 * Pantalla de inicio: seguir con el documento abierto, abrir una foto (botón,
 * arrastrar o pegar), abrir un video (botón) o empezar un lienzo en blanco de
 * un tamaño: genérico o con las medidas de una red social (una sección por
 * red, ver `CANVAS_SECTIONS`).
 *
 * Empezar otro documento borra el actual y su historial, así que si tiene
 * algo se pide confirmación antes.
 */
const HomeScreen = () => {
  const hasContent = useEditorStore(selectHasDocumentContent);
  const setMode = useEditorStore((state) => state.setMode);
  const setStatus = useEditorStore((state) => state.setStatus);
  const loadPhoto = useEditorStore((state) => state.loadPhoto);
  const newDocument = useEditorStore((state) => state.newDocument);
  const canHover = useMediaQuery(HOVER_QUERY);
  // Lo que se hará al confirmar "Descartar y abrir".
  const [pending, setPending] = useState<(() => void) | null>(null);

  const runOrConfirm = (action: () => void) => {
    if (hasContent) setPending(() => action);
    else action();
  };

  const openFile = async (file: File) => {
    setStatus("loading");
    try {
      loadPhoto(await openImageFile(file));
      setMode("draw");
    } catch (error) {
      console.error(error);
      toast.error(IMAGE_OPEN_ERROR_MESSAGE);
    } finally {
      setStatus("idle");
    }
  };

  const openVideo = async (file: File) => {
    setStatus("loadingVideo");
    try {
      loadPhoto(await openVideoFile(file));
      setMode("draw");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof VideoOpenError
          ? error.message
          : "No se pudo abrir el video"
      );
    } finally {
      setStatus("idle");
    }
  };

  const isDragging = useImageDropAndPaste((file) =>
    runOrConfirm(() => void openFile(file))
  );

  const photoPicker = useFilePicker({ accept: "image/*", onFile: openFile });
  const videoPicker = useFilePicker({ accept: "video/*", onFile: openVideo });

  return (
    <div className={styles.home}>
      <section className={styles.card} aria-labelledby="home-title">
        <header className={styles.intro}>
          <h1 id="home-title" className={styles.title}>
            Editor de imágenes
          </h1>
          <p className={styles.subtitle}>
            Dibuja, escribe y añade fondos a tus fotos.
          </p>
        </header>

        {hasContent && (
          <Button className={styles.action} onClick={() => setMode("draw")}>
            <ArrowRight aria-hidden="true" />
            Seguir editando
          </Button>
        )}

        <div className={styles.open}>
          {photoPicker.fileInput}
          <Button
            variant="primary"
            className={classNames(styles.action, styles.primaryAction)}
            onClick={() => runOrConfirm(photoPicker.openPicker)}
          >
            <ImagePlus aria-hidden="true" />
            Abrir una foto
          </Button>
          {canHover && (
            <p className={styles.hint}>
              o arrástrala aquí · {MOD_KEY}+V para pegarla
            </p>
          )}
        </div>

        {videoPicker.fileInput}
        <Button
          className={styles.action}
          onClick={() => runOrConfirm(videoPicker.openPicker)}
        >
          <Video aria-hidden="true" />
          Agregar video
        </Button>

        {CANVAS_SECTIONS.map((section) => (
          <CardSection
            key={section.id}
            title={section.title}
            icon={NETWORK_ICONS[section.id]}
            headingLevel={2}
            gridClassName={styles.presets}
          >
            {section.presets.map(({ id, label, size }) => {
              const { width, height } = size();
              const name = section.network
                ? `${label} de ${section.network}`
                : label;
              return (
                <button
                  key={id}
                  type="button"
                  className={styles.preset}
                  aria-label={`${name}, ${width} × ${height} píxeles`}
                  onClick={() => runOrConfirm(() => newDocument(size()))}
                >
                  <span className={styles.shapeBox} aria-hidden="true">
                    <span
                      className={styles.shape}
                      style={shapeStyle(width, height)}
                    />
                  </span>
                  <span className={styles.presetLabel}>{label}</span>
                  <span className={styles.presetSize} aria-hidden="true">
                    {width} × {height}
                  </span>
                </button>
              );
            })}
          </CardSection>
        ))}
      </section>

      {isDragging && (
        <div className={styles.dropOverlay} aria-hidden="true">
          Suelta la imagen para abrirla
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="¿Empezar de nuevo?"
        description="Se descartará el documento actual y su historial (no se puede deshacer)."
        confirmLabel="Descartar y abrir"
        isDestructive
        onConfirm={() => {
          const action = pending;
          setPending(null);
          action?.();
        }}
      />
    </div>
  );
};

export default HomeScreen;
