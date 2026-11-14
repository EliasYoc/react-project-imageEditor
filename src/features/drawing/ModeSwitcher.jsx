import ToolBox from "../../components/layout/ToolBox";
import { Button } from "../../components/ui/Button";
import { useEditorStore } from "../../editor/store/editorStore";

const MODES = [
  { mode: "draw", label: "Dibujar" },
  { mode: "text", label: "Texto" },
];

/** Cambia entre los modos "Dibujar" y "Texto" del editor. */
const ModeSwitcher = () => {
  const currentMode = useEditorStore((state) => state.mode);
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
      {MODES.map(({ mode, label }) => (
        <Button
          key={mode}
          aria-pressed={currentMode === mode}
          onClick={() => setMode(mode)}
        >
          {label}
        </Button>
      ))}
    </ToolBox>
  );
};

export default ModeSwitcher;
