import { ArrowRight, ImagePlus } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/Dialog";
import { toast } from "../../../components/ui/Toast";
import type { Size } from "../../../editor/model/types";
import { classNames } from "../../../lib/classNames";
import { useEditorStore } from "../../../editor/store/editorStore";
import { selectHasDocumentContent } from "../../../editor/store/selectors";
import { HOVER_QUERY, useMediaQuery } from "../../../lib/useMediaQuery";
import { MOD_KEY } from "../../shortcuts";
import styles from "./HomeScreen.module.css";
import { openImageFile } from "../utils/openImageFile";
import { useImageDropAndPaste } from "../hooks/useImageDrop";

/** Lado mayor del lienzo "Pantalla". */
const MAX_SCREEN_SIDE = 2048;

/** La proporción de la pantalla, en píxeles reales, hasta 2048 px. */
const screenCanvasSize = (): Size => {
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth * ratio;
  const height = window.innerHeight * ratio;
  const scale = Math.min(1, MAX_SCREEN_SIDE / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

/** La forma del lienzo dibujada en un cuadro de SHAPE_BOX px. */
const SHAPE_BOX = 36;
const shapeStyle = (width: number, height: number) => {
  const scale = SHAPE_BOX / Math.max(width, height);
  return { width: width * scale, height: height * scale };
};

const CANVAS_PRESETS: { id: string; label: string; size: () => Size }[] = [
  { id: "screen", label: "Pantalla", size: screenCanvasSize },
  {
    id: "square",
    label: "Cuadrado",
    size: () => ({ width: 2048, height: 2048 }),
  },
  {
    id: "story",
    label: "Historia",
    size: () => ({ width: 1080, height: 1920 }),
  },
  {
    id: "landscape",
    label: "Horizontal",
    size: () => ({ width: 1920, height: 1080 }),
  },
];

/**
 * Pantalla de inicio: seguir con el documento abierto, abrir una foto (botón,
 * arrastrar o pegar) o empezar un lienzo en blanco de un tamaño.
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

  const isDragging = useImageDropAndPaste((file) =>
    runOrConfirm(() => void openFile(file))
  );

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Permite volver a elegir el mismo archivo.
    input.value = "";
    if (file) void openFile(file);
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
            onChange={onFileChosen}
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

        <section className={styles.blank} aria-labelledby="home-blank">
          <h2 id="home-blank" className={styles.sectionTitle}>
            Lienzo en blanco
          </h2>
          <div className={styles.presets}>
            {CANVAS_PRESETS.map(({ id, label, size }) => {
              const { width, height } = size();
              return (
                <button
                  key={id}
                  type="button"
                  className={styles.preset}
                  aria-label={`${label}, ${width} × ${height} píxeles`}
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
