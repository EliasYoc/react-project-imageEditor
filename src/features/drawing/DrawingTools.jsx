import { useState } from "react";
import { BiPaint, BiSprayCan } from "react-icons/bi";
import { BsEraser } from "react-icons/bs";
import PortalsSwipeableMenuLayout from "../../components/layout/PortalsSwipeableMenuLayout";
import {
  GlobalButton,
  PencilBackgroundColor,
} from "../../components/ui/legacy/styledComponents";
import { rgbaToCss } from "../../editor/model/color";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectCurrentBrush } from "../../editor/store/selectors";
import { themeColor } from "../../styles/theme";
import BrushButton from "./BrushButton";
import BrushColorPicker from "./BrushColorPicker";

const DrawingTools = () => {
  const brushType = useEditorStore((state) => state.brush.type);
  const color = useEditorStore((state) => selectCurrentBrush(state).color);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // El borrador no tiene color propio.
  const canPickColor = brushType !== "eraser";

  return (
    <>
      <BrushButton icon={BiPaint} brushType="normal" label="Pincel" />
      <BrushButton icon={BiSprayCan} brushType="spray" label="Spray" />
      <BrushButton icon={BsEraser} brushType="eraser" label="Borrador" />
      {/* El tamaño de cada cuadro del fondo a cuadros es la mitad de background-size. */}
      <GlobalButton
        border={`3px solid ${themeColor.textColor}`}
        backgroundColor="#eee"
        backgroundImage="linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0),
                  linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0);"
        backgroundPosition="0 0, 7.5px 7.5px"
        backgroundSize="15px 15px"
        onClick={() => canPickColor && setIsColorPickerOpen(true)}
        padding="0"
      >
        <PencilBackgroundColor
          style={{
            border: `4px solid black`,
            borderRadius: "50px",
          }}
          backgroundColor={rgbaToCss(color)}
        />
      </GlobalButton>

      <PortalsSwipeableMenuLayout
        title="Escoge un color individual"
        isOpen={isColorPickerOpen && canPickColor}
        onClose={() => setIsColorPickerOpen(false)}
      >
        <BrushColorPicker />
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default DrawingTools;
