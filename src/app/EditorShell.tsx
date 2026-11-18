import { useEffect, useRef } from "react";
import { NO_INSETS } from "../editor/engine/viewport";
import EditorStage from "../editor/stage/EditorStage";
import { viewStore } from "../editor/stage/viewStore";
import { useEditorStore } from "../editor/store/editorStore";
import { selectVideo } from "../editor/store/selectors";
import { DrawingTools, ModeSwitcher, SizeSlider } from "../features/drawing";
import { EditorHeader } from "../features/editor-header";
import { ShortcutsDialog } from "../features/shortcuts";
import { TextToolbar } from "../features/text";
import { PlaybackBar } from "../features/video";
import { ViewMenu } from "../features/view";
import { DESKTOP_QUERY, useMediaQuery } from "../lib/useMediaQuery";
import styles from "./EditorShell.module.css";
import { useUiStore } from "./uiStore";

/**
 * El editor: el lienzo a pantalla completa, con la cabecera y la barra
 * inferior flotando encima (position: absolute) para que no le quiten altura.
 * Las dos son transparentes: solo sus grupos de botones tienen fondo. Es todo
 * lo que necesita Konva, así que va en su propio archivo y se carga bajo
 * demanda (ver App): la pantalla de inicio no lo descarga.
 *
 * Al ajustar a pantalla, el documento deja libre la altura de la cabecera
 * (sus botones quedan siempre a mano, sin tapar el dibujo). Bajo la barra
 * inferior sí puede quedar. Con las barras ocultas (menú de la vista), el
 * documento usa toda la pantalla.
 *
 * El lienzo es el Stage de Konva con el fondo, la pintura, los textos y las
 * imágenes. Encima, el slider de tamaño (borde izquierdo) y el menú de la
 * vista (derecha), colocados por encima de la barra inferior con su altura
 * (`--footer-height`, 0 con las barras ocultas). El selector de modo va abajo
 * en el móvil (al alcance del pulgar) y en la cabecera en escritorio. Con un
 * video abierto, la barra de reproducción va encima de las herramientas.
 *
 * Con el editor cerrado (en el inicio) el lienzo se oculta pero sigue
 * montado: el documento y sus rasters no se pierden.
 */
const EditorShell = ({ isOpen }: { isOpen: boolean }) => {
  const mode = useEditorStore((state) => state.mode);
  const video = useEditorStore(selectVideo);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const areBarsHidden = useUiStore((state) => state.areBarsHidden);
  const stageRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(
    function keepDocumentClearOfHeader() {
      const stage = stageRef.current;
      if (!stage) return;
      const headerHeight = parseFloat(
        getComputedStyle(stage).getPropertyValue("--header-height")
      );
      const top =
        areBarsHidden || !Number.isFinite(headerHeight) ? 0 : headerHeight;
      viewStore.getState().setInsets({ ...NO_INSETS, top });
      // Para colocar el slider de tamaño (0 con las barras ocultas).
      stage.style.setProperty("--header-offset", `${top}px`);
    },
    [areBarsHidden]
  );

  useEffect(
    function shareFooterHeight() {
      const stage = stageRef.current;
      const footer = footerRef.current;
      if (!stage || !footer) return;
      // Su altura cambia con el modo y si la barra pasa a dos filas.
      const update = () =>
        stage.style.setProperty(
          "--footer-height",
          `${areBarsHidden ? 0 : footer.offsetHeight}px`
        );
      const observer = new ResizeObserver(update);
      observer.observe(footer);
      update();
      return () => {
        observer.disconnect();
        stage.style.removeProperty("--footer-height");
      };
    },
    [isOpen, areBarsHidden]
  );

  return (
    <>
      {isOpen && (
        <EditorHeader center={isDesktop ? <ModeSwitcher /> : undefined} />
      )}

      <main ref={stageRef} className={styles.stage}>
        <div className={styles.canvas} hidden={!isOpen}>
          <EditorStage />
        </div>
        {isOpen && (
          <>
            <SizeSlider />
            <ViewMenu />
          </>
        )}
      </main>

      {isOpen && (
        <footer
          ref={footerRef}
          className={styles.footer}
          data-hidden={areBarsHidden || undefined}
          // Oculta: fuera del orden de Tab y de los lectores de pantalla.
          inert={areBarsHidden}
        >
          {video && <PlaybackBar video={video} />}
          <div
            className={styles.toolbar}
            role="group"
            aria-label={
              mode === "draw"
                ? "Herramientas de dibujo"
                : "Herramientas de texto"
            }
          >
            {mode === "draw" && <DrawingTools />}
            {mode === "text" && <TextToolbar />}
          </div>
          {!isDesktop && <ModeSwitcher />}
        </footer>
      )}

      {isOpen && <ShortcutsDialog />}
    </>
  );
};

export default EditorShell;
