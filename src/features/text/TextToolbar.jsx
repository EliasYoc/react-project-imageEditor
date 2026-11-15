import { useState } from "react";
import { RgbaColorPicker } from "react-colorful";
import { BiTrash } from "react-icons/bi";
import { MdTextFields } from "react-icons/md";
import PortalsSwipeableMenuLayout from "../../components/layout/PortalsSwipeableMenuLayout";
import { IconButton } from "../../components/ui/Button";
import {
  GlobalButton,
  PencilBackgroundColor,
} from "../../components/ui/legacy/styledComponents";
import { defaultFontSize } from "../../editor/model/factories";
import { rgbaToCss } from "../../editor/model/color";
import { documentPointAtViewCenter } from "../../editor/stage/viewStore";
import { editorStore, useEditorStore } from "../../editor/store/editorStore";
import {
  selectSelectedElement,
  selectSelectedText,
} from "../../editor/store/selectors";
import IncludeImageButton from "../images/IncludeImageButton";
import BoldButton from "./BoldButton";
import FontsButton from "./FontsButton";

/** Crea un texto en el centro de lo que se ve y abre el editor para escribirlo. */
const addTextAtViewCenter = () => {
  const { addText, startTextEditing, canvasSize } = editorStore.getState();
  const fontSize = defaultFontSize(canvasSize);
  const center = documentPointAtViewCenter();
  // La esquina queda un poco a la izquierda y arriba del centro: el texto
  // crece hacia la derecha al escribir.
  const id = addText(
    { x: center.x - fontSize, y: center.y - fontSize / 2 },
    fontSize
  );
  startTextEditing(id);
};

const TextToolbar = () => {
  const selectedText = useEditorStore(selectSelectedText);
  const selectedElement = useEditorStore(selectSelectedElement);
  const editElement = useEditorStore((state) => state.editElement);
  const removeElement = useEditorStore((state) => state.removeElement);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const canPickColor = selectedText !== null;

  return (
    <>
      <IconButton
        icon={MdTextFields}
        aria-label="Agregar texto"
        onClick={addTextAtViewCenter}
      />
      <IncludeImageButton />
      <BoldButton />
      <FontsButton />
      <GlobalButton
        border="3px solid var(--color-text)"
        backgroundColor="#eee"
        backgroundImage="linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0),
                  linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0);"
        backgroundPosition="0 0, 7.5px 7.5px"
        backgroundSize="15px 15px"
        onClick={() => canPickColor && setIsColorPickerOpen(true)}
        padding="0"
        aria-label="Color del texto"
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
      <IconButton
        icon={BiTrash}
        aria-label="Eliminar"
        disabled={!selectedElement}
        onClick={() => selectedElement && removeElement(selectedElement.id)}
      />
      <PortalsSwipeableMenuLayout
        title="Color del texto"
        isOpen={isColorPickerOpen && canPickColor}
        onClose={() => setIsColorPickerOpen(false)}
      >
        {canPickColor && (
          <RgbaColorPicker
            color={selectedText.color}
            // Arrastrar en el selector crea un solo paso del historial.
            onChange={(color) =>
              editElement(
                selectedText.id,
                { color },
                `color:${selectedText.id}`
              )
            }
          />
        )}
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default TextToolbar;
