import { ArrowRight, ImagePlus, Video } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/Dialog";
import { toast } from "../../../components/ui/Toast";
import { classNames } from "../../../lib/classNames";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectHasDocumentContent } from "../../../editor/store/selectors";
import { HOVER_QUERY, useMediaQuery } from "../../../lib/useMediaQuery";
import { MOD_KEY } from "../../shortcuts";
import styles from "./HomeScreen.module.css";
import { CANVAS_SECTIONS } from "../constants/canvasPresets";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
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
      toast.error("No se pudo abrir la imagen");
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

  const onFileChosen =
    (open: (file: File) => Promise<void>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      // Permite volver a elegir el mismo archivo.
      input.value = "";
      if (file) void open(file);
    };

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
          {/* El <input type="file"> está oculto; el botón visible lo abre. Así
              el botón recibe foco y funciona con teclado (un <label> no). */}
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/*"
            onChange={onFileChosen(openFile)}
          />
          <Button
            variant="primary"
            className={classNames(styles.action, styles.primaryAction)}
            onClick={() => runOrConfirm(() => fileInputRef.current?.click())}
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

        <input
          ref={videoInputRef}
          hidden
          type="file"
          accept="video/*"
          onChange={onFileChosen(openVideo)}
        />
        <Button
          className={styles.action}
          onClick={() => runOrConfirm(() => videoInputRef.current?.click())}
        >
          <Video aria-hidden="true" />
          Agregar video
        </Button>

        {CANVAS_SECTIONS.map((section) => (
          <section
            key={section.id}
            className={styles.canvasSection}
            aria-labelledby={`home-${section.id}`}
          >
            <h2 id={`home-${section.id}`} className={styles.sectionTitle}>
              {section.title}
            </h2>
            <div className={styles.presets}>
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
            </div>
          </section>
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
        destructive
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
