import "../styles/moveable.css";
import styles from "./App.module.css";
import { useEditorStore } from "../editor/store/editorStore";
import Header from "../components/layout/Header";
import ToolBox from "../components/layout/ToolBox";
import LoaderSpinner from "../components/ui/LoaderSpinner";
import { FixedContainer } from "../components/ui/legacy/styledComponents";
import EditorHeader from "../features/editor-header/EditorHeader";
import HomeToolbar from "../features/home/HomeToolbar";
import DrawingTools from "../features/drawing/DrawingTools";
import ModeSwitcher from "../features/drawing/ModeSwitcher";
import Canvas from "../features/drawing/legacy/Canvas";
import DrawingOverlay from "../features/drawing/legacy/DrawingOverlay";
import TextToolbar from "../features/text/TextToolbar";

/**
 * Shell de la aplicación: cabecera | lienzo | barra inferior.
 *
 * El lienzo ocupa el espacio que sobra (flex: 1) y los dos <canvas> se
 * superponen dentro de él. Antes se calculaba su altura sumando en JS las
 * alturas del header y del footer.
 */
function App() {
  const mode = useEditorStore((state) => state.mode);
  const isBusy = useEditorStore((state) => state.status !== "idle");
  const isEditorOpen = mode !== "home";

  return (
    <div className={styles.app}>
      {isEditorOpen && (
        <Header>
          <EditorHeader />
        </Header>
      )}

      <main className={styles.stage}>
        <Canvas />
        {isEditorOpen ? <DrawingOverlay /> : <HomeToolbar />}
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
        <FixedContainer zIndex="1000">
          <LoaderSpinner />
        </FixedContainer>
      )}
    </div>
  );
}

export default App;
