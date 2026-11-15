import { Spinner } from "../components/ui/Spinner";
import { TooltipProvider } from "../components/ui/Tooltip";
import EditorStage from "../editor/stage/EditorStage";
import { useEditorStore } from "../editor/store/editorStore";
import DrawingTools from "../features/drawing/DrawingTools";
import ModeSwitcher from "../features/drawing/ModeSwitcher";
import SizeSlider from "../features/drawing/SizeSlider";
import EditorHeader from "../features/editor-header/EditorHeader";
import HomeToolbar from "../features/home/HomeToolbar";
import { useKeyboardShortcuts } from "../features/shortcuts/useKeyboardShortcuts";
import TextToolbar from "../features/text/TextToolbar";
import ZoomControls from "../features/zoom/ZoomControls";
import { DESKTOP_QUERY, useMediaQuery } from "../lib/useMediaQuery";
import styles from "./App.module.css";

const STATUS_LABELS = {
  loading: "Abriendo la imagen",
  exporting: "Exportando la imagen",
} as const;

/**
 * Shell de la aplicación: cabecera | lienzo | barra inferior.
 *
 * El lienzo ocupa el espacio que sobra (flex: 1): el Stage de Konva con el
 * fondo, la pintura, los textos y las imágenes. Encima, el slider de tamaño
 * (borde izquierdo) y el zoom (derecha). El selector de modo va abajo en el móvil
 * (al alcance del pulgar) y en la cabecera en escritorio.
 */
function App() {
  const mode = useEditorStore((state) => state.mode);
  const status = useEditorStore((state) => state.status);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isEditorOpen = mode !== "home";
  useKeyboardShortcuts();

  return (
    <TooltipProvider>
      <div className={styles.app}>
        {isEditorOpen && (
          <EditorHeader center={isDesktop ? <ModeSwitcher /> : undefined} />
        )}

        <main className={styles.stage}>
          <EditorStage />
          {isEditorOpen ? (
            <>
              <SizeSlider />
              <ZoomControls />
            </>
          ) : (
            <HomeToolbar />
          )}
        </main>

        {isEditorOpen && (
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

        {status !== "idle" && <Spinner label={STATUS_LABELS[status]} />}
      </div>
    </TooltipProvider>
  );
}

export default App;
