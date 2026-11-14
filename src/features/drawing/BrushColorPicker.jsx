import { RgbaColorPicker } from "react-colorful";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectCurrentBrush } from "../../editor/store/selectors";

/** Selector de color del pincel actual (cada pincel guarda el suyo). */
const BrushColorPicker = () => {
  const color = useEditorStore((state) => selectCurrentBrush(state).color);
  const setBrushColor = useEditorStore((state) => state.setBrushColor);

  return <RgbaColorPicker color={color} onChange={setBrushColor} />;
};

export default BrushColorPicker;
