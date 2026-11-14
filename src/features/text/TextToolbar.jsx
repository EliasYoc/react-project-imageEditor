import { useState } from "react";
import { RgbaColorPicker } from "react-colorful";
import PortalsSwipeableMenuLayout from "../../components/layout/PortalsSwipeableMenuLayout";
import {
  GlobalButton,
  PencilBackgroundColor,
} from "../../components/ui/legacy/styledComponents";
import { rgbaToCss } from "../../editor/model/color";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectSelectedText } from "../../editor/store/selectors";
import { themeColor } from "../../styles/theme";
import IncludeImageButton from "../images/IncludeImageButton";
import BoldButton from "./BoldButton";
import FontsButton from "./FontsButton";

const TextToolbar = () => {
  const selectedText = useEditorStore(selectSelectedText);
  const addText = useEditorStore((state) => state.addText);
  const updateElement = useEditorStore((state) => state.updateElement);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const canPickColor = selectedText !== null;

  return (
    <>
      <GlobalButton
        onClick={addText}
        width="auto"
        height="auto"
        fontSize="1rem"
      >
        Agregar
      </GlobalButton>
      <IncludeImageButton />
      <BoldButton />
      <FontsButton />
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
          backgroundColor={
            canPickColor ? rgbaToCss(selectedText.color) : "transparent"
          }
        />
      </GlobalButton>
      <PortalsSwipeableMenuLayout
        title="Escoge un color individual"
        isOpen={isColorPickerOpen && canPickColor}
        onClose={() => setIsColorPickerOpen(false)}
      >
        {canPickColor && (
          <RgbaColorPicker
            color={selectedText.color}
            onChange={(color) => updateElement(selectedText.id, { color })}
          />
        )}
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default TextToolbar;
