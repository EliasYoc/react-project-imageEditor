import { PaintRoller, Trash2, Type } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "../../../components/ui/Button";
import { ColorControl } from "../../../components/ui/ColorControl";
import { Panel } from "../../../components/ui/Panel";
import { Tooltip } from "../../../components/ui/Tooltip";
import { getFont } from "../../../editor/elements/fonts";
import { COLOR_PRESETS } from "../../../editor/engine/fill/presets";
import { defaultFontSize } from "../../../editor/model/factories";
import type { Rgba } from "../../../editor/model/types";
import { documentPointAtViewCenter } from "../../../editor/stage/viewStore";
import { editorStore, useEditorStore } from "../../../editor/store/editorStore";
import {
  selectSelectedElement,
  selectSelectedText,
} from "../../../editor/store/selectors";
import { IncludeImageButton } from "../../images";
import { SHORTCUT_LABELS } from "../../shortcuts";
import FontPicker from "./FontPicker";
import TextStylePanel from "./TextStylePanel";
import panelStyles from "./TextPanels.module.css";

/** Color que se ve en el botón cuando no hay texto seleccionado. */
const NO_COLOR: Rgba = { r: 0, g: 0, b: 0, a: 0 };

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

type Sheet = "font" | "style";

/**
 * Barra del modo Texto: añadir texto, insertar imagen, fuente, estilo, color
 * y eliminar. Fuente, estilo y color se aplican al texto seleccionado.
 */
const TextToolbar = () => {
  const selectedText = useEditorStore(selectSelectedText);
  const selectedElement = useEditorStore(selectSelectedElement);
  const editElement = useEditorStore((state) => state.editElement);
  const removeElement = useEditorStore((state) => state.removeElement);
  // Panel abierto: el de fuentes o el de estilo (uno a la vez).
  const [openSheet, setOpenSheet] = useState<Sheet | null>(null);

  const font = getFont(selectedText?.fontId ?? "normal");
  const closeSheet = (open: boolean) => !open && setOpenSheet(null);

  return (
    <>
      <IconButton
        icon={Type}
        aria-label="Agregar texto"
        onClick={addTextAtViewCenter}
      />
      <IncludeImageButton />
      <Tooltip label="Fuente y grosor">
        <Button
          size="sm"
          className={panelStyles.fontButton}
          style={{ fontFamily: font.family }}
          disabled={!selectedText}
          aria-haspopup="dialog"
          aria-label={`Fuente: ${font.label}`}
          onClick={() => setOpenSheet("font")}
        >
          {font.label}
        </Button>
      </Tooltip>
      <IconButton
        icon={PaintRoller}
        aria-label="Estilo del texto"
        aria-haspopup="dialog"
        disabled={!selectedText}
        onClick={() => setOpenSheet("style")}
      />
      <ColorControl
        label="Color del texto"
        color={selectedText?.color ?? NO_COLOR}
        disabled={!selectedText}
        alpha
        swatches={COLOR_PRESETS}
        // Arrastrar en el selector crea un solo paso del historial.
        onChange={(color) =>
          selectedText &&
          editElement(selectedText.id, { color }, `color:${selectedText.id}`)
        }
      />
      <IconButton
        icon={Trash2}
        aria-label="Eliminar"
        shortcut={SHORTCUT_LABELS.deleteElement}
        disabled={!selectedElement}
        onClick={() => selectedElement && removeElement(selectedElement.id)}
      />
      <Panel
        open={openSheet === "font" && selectedText !== null}
        onOpenChange={closeSheet}
        title="Fuente"
      >
        {selectedText && <FontPicker text={selectedText} />}
      </Panel>
      <Panel
        open={openSheet === "style" && selectedText !== null}
        onOpenChange={closeSheet}
        title="Estilo del texto"
      >
        {selectedText && <TextStylePanel text={selectedText} />}
      </Panel>
    </>
  );
};

export default TextToolbar;
