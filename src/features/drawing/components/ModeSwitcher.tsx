import { Brush, Type } from "lucide-react";
import {
  Segmented,
  type SegmentedItem,
} from "../../../components/ui/Segmented";
import type { Mode } from "../../../editor/model/types";
import { useEditorStore } from "../../../editor/store/editorStore";

type EditorMode = Exclude<Mode, "home">;

const MODES: readonly SegmentedItem<EditorMode>[] = [
  { value: "draw", label: "Dibujar", icon: Brush },
  { value: "text", label: "Texto", icon: Type },
];

/**
 * Cambia entre los modos "Dibujar" y "Texto", en el centro de la cabecera.
 * Con `iconOnly` (el móvil) solo muestra los iconos: el nombre queda para el
 * lector de pantalla.
 */
const ModeSwitcher = ({ iconOnly = false }: { iconOnly?: boolean }) => {
  const mode = useEditorStore((state) => state.mode);
  const setMode = useEditorStore((state) => state.setMode);
  return (
    <Segmented
      label="Modo"
      size="sm"
      iconOnly={iconOnly}
      value={mode === "home" ? null : mode}
      onChange={setMode}
      items={MODES}
    />
  );
};

export default ModeSwitcher;
