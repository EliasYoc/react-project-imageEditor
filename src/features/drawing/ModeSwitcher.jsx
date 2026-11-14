import ToolBox from "../../components/layout/ToolBox";
import { GlobalButton } from "../../components/ui/legacy/styledComponents";
import { useEditorStore } from "../../editor/store/editorStore";

/** Cambia entre los modos "Dibujar" y "Texto" del editor. */
const ModeSwitcher = () => {
  const setMode = useEditorStore((state) => state.setMode);

  return (
    <ToolBox
      display="flex"
      justifyContent="space-around"
      borderRadius="50px"
      position="relative"
      margin="0px auto"
      gap="1rem"
      backgroundColor="none"
    >
      <GlobalButton
        onClick={() => setMode("draw")}
        fontSize="1rem"
        width="auto"
        height="auto"
      >
        Dibujar
      </GlobalButton>
      <GlobalButton
        onClick={() => setMode("text")}
        fontSize="1rem"
        width="auto"
        height="auto"
      >
        Texto
      </GlobalButton>
    </ToolBox>
  );
};

export default ModeSwitcher;
