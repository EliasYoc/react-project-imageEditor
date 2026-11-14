import "../styles/moveable.css";
import styles from "./App.module.css";
import { useEditorStore } from "../editor/store/editorStore";
import Header from "../components/layout/Header";
import ToolBox from "../components/layout/ToolBox";
import LoaderSpinner from "../components/ui/LoaderSpinner";
import { FixedContainer } from "../components/ui/legacy/styledComponents";
import EditorStage from "../editor/stage/EditorStage";
import EditorHeader from "../features/editor-header/EditorHeader";
import HomeToolbar from "../features/home/HomeToolbar";
import DrawingTools from "../features/drawing/DrawingTools";
import ModeSwitcher from "../features/drawing/ModeSwitcher";
import SizeSlider from "../features/drawing/SizeSlider";
import { useKeyboardShortcuts } from "../features/shortcuts/useKeyboardShortcuts";
import TextToolbar from "../features/text/TextToolbar";
import ElementsOverlay from "../features/text/legacy/ElementsOverlay";
import ZoomControls from "../features/zoom/ZoomControls";

/**
 * Shell de la aplicación: cabecera | lienzo | barra inferior.
 *
 * El lienzo ocupa el espacio que sobra (flex: 1): el Stage de Konva y, encima,
 * la capa HTML con los textos e imágenes. Antes se calculaba su altura
 * sumando en JS las alturas del header y del footer.
 */
function App() {
  const mode = useEditorStore((state) => state.mode);
  const isBusy = useEditorStore((state) => state.status !== "idle");
  const isEditorOpen = mode !== "home";
  useKeyboardShortcuts();

  return (
    <div className={styles.app}>
      {isEditorOpen && (
        <Header>
          <EditorHeader />
        </Header>
      )}

      <main className={styles.stage}>
        <EditorStage />
        {isEditorOpen ? (
          <>
            <ElementsOverlay />
            <SizeSlider />
            {/* El zoom solo existe en modo Dibujar (ver useDisplayView). */}
            {mode === "draw" && <ZoomControls />}
          </>
        ) : (
          <HomeToolbar />
        )}
      </main>

      {isEditorOpen && (
        <footer className={styles.footer}>
          <ToolBox
            display="flex"
            borderRadius="50px"
            position="relative"
            margin="10px auto 0"
            padding="0 1rem"
            gap=".5rem"
          >
            {mode === "draw" && <DrawingTools />}
            {mode === "text" && <TextToolbar />}
          </ToolBox>
          <ModeSwitcher />
        </footer>
      )}

      {isBusy && (
        <FixedContainer zIndex="var(--z-loader)">
          <LoaderSpinner />
        </FixedContainer>
      )}
    </div>
  );
}

export default App;
