import EditorStage from "../editor/stage/EditorStage";
import { useEditorStore } from "../editor/store/editorStore";
import DrawingTools from "../features/drawing/DrawingTools";
import ModeSwitcher from "../features/drawing/ModeSwitcher";
import SizeSlider from "../features/drawing/SizeSlider";
import EditorHeader from "../features/editor-header/EditorHeader";
import ShortcutsDialog from "../features/shortcuts/ShortcutsDialog";
import TextToolbar from "../features/text/TextToolbar";
import ZoomControls from "../features/zoom/ZoomControls";
import { DESKTOP_QUERY, useMediaQuery } from "../lib/useMediaQuery";
import styles from "./EditorShell.module.css";

/**
 * El editor: cabecera | lienzo | barra inferior. Es todo lo que necesita
 * Konva, así que va en su propio archivo y se carga bajo demanda (ver App):
 * la pantalla de inicio no lo descarga.
 *
 * El lienzo ocupa el espacio que sobra (flex: 1): el Stage de Konva con el
 * fondo, la pintura, los textos y las imágenes. Encima, el slider de tamaño
 * (borde izquierdo) y el zoom (derecha). El selector de modo va abajo en el
 * móvil (al alcance del pulgar) y en la cabecera en escritorio.
 *
 * Con el editor cerrado (en el inicio) el lienzo se oculta pero sigue
 * montado: el documento y sus rasters no se pierden.
 */
const EditorShell = ({ isOpen }: { isOpen: boolean }) => {
  const mode = useEditorStore((state) => state.mode);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  return (
    <>
      {isOpen && (
        <EditorHeader center={isDesktop ? <ModeSwitcher /> : undefined} />
      )}

      <main className={styles.stage}>
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
        <footer className={styles.footer}>
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
