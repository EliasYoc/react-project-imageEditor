import { RgbColorPicker } from "react-colorful";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectBrushColor } from "../../editor/store/selectors";

/**
 * Color de los pinceles (el mismo para todos). Sin canal alfa: la
 * transparencia es la opacidad de cada pincel.
 */
const BrushColorPicker = () => {
  const color = useEditorStore(selectBrushColor);
  const setBrushColor = useEditorStore((state) => state.setBrushColor);

  return (
    <RgbColorPicker
      color={color}
      onChange={(rgb) => setBrushColor({ ...rgb, a: 1 })}
    />
  );
};

export default BrushColorPicker;
