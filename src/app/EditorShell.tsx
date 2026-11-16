import { useEffect, useRef } from "react";
import EditorStage from "../editor/stage/EditorStage";
import { useEditorStore } from "../editor/store/editorStore";
import { DrawingTools, ModeSwitcher, SizeSlider } from "../features/drawing";
import { EditorHeader } from "../features/editor-header";
import { ShortcutsDialog } from "../features/shortcuts";
import { TextToolbar } from "../features/text";
import { ZoomControls } from "../features/zoom";
import { DESKTOP_QUERY, useMediaQuery } from "../lib/useMediaQuery";
import styles from "./EditorShell.module.css";

/**
 * El editor: el lienzo a pantalla completa, con la cabecera y la barra
 * inferior flotando encima (position: absolute) para que no le quiten altura.
 * Es todo lo que necesita Konva, así que va en su propio archivo y se carga
 * bajo demanda (ver App): la pantalla de inicio no lo descarga.
 *
 * El lienzo es el Stage de Konva con el fondo, la pintura, los textos y las
 * imágenes. Encima, el slider de tamaño (borde izquierdo) y el zoom
 * (derecha), colocados por encima de la barra inferior con su altura
 * (`--footer-height`). El selector de modo va abajo en el móvil (al alcance
 * del pulgar) y en la cabecera en escritorio.
 *
 * Con el editor cerrado (en el inicio) el lienzo se oculta pero sigue
 * montado: el documento y sus rasters no se pierden.
 */
const EditorShell = ({ isOpen }: { isOpen: boolean }) => {
  const mode = useEditorStore((state) => state.mode);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const stageRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(
    function shareFooterHeight() {
      const stage = stageRef.current;
      const footer = footerRef.current;
      if (!stage || !footer) return;
      // Su altura cambia con el modo y si la barra pasa a dos filas.
      const observer = new ResizeObserver(() =>
        stage.style.setProperty("--footer-height", `${footer.offsetHeight}px`)
      );
      observer.observe(footer);
      return () => {
        observer.disconnect();
        stage.style.removeProperty("--footer-height");
      };
    },
    [isOpen]
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
            <ZoomControls />
          </>
        )}
      </main>

      {isOpen && (
        <footer ref={footerRef} className={styles.footer}>
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
