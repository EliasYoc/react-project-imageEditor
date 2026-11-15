import { Brush, Type } from "lucide-react";
import { Segmented, type SegmentedItem } from "../../components/ui/Segmented";
import type { Mode } from "../../editor/model/types";
import { useEditorStore } from "../../editor/store/editorStore";

type EditorMode = Exclude<Mode, "home">;

const MODES: readonly SegmentedItem<EditorMode>[] = [
  { value: "draw", label: "Dibujar", icon: Brush },
  { value: "text", label: "Texto", icon: Type },
];

/**
 * Cambia entre los modos "Dibujar" y "Texto". En el móvil va abajo, al
 * alcance del pulgar; en escritorio, en el centro de la cabecera.
 */
const ModeSwitcher = () => {
  const mode = useEditorStore((state) => state.mode);
  const setMode = useEditorStore((state) => state.setMode);
  return (
    <Segmented
      label="Modo"
      size="sm"
      value={mode === "home" ? null : mode}
      onChange={setMode}
      items={MODES}
    />
  );
};

export default ModeSwitcher;
