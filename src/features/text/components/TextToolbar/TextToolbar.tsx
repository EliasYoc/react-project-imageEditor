import {
  CircleQuestionMark,
  EllipsisVertical,
  ImagePlus,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "../../../../components/ui/Button";
import { ColorControl } from "../../../../components/ui/ColorControl";
import { Menu, type MenuItem } from "../../../../components/ui/Menu";
import { Panel } from "../../../../components/ui/Panel";
import { Tooltip } from "../../../../components/ui/Tooltip";
import { getFont } from "../../../../editor/elements/fonts";
import { COLOR_PRESETS } from "../../../../editor/engine/fill/presets";
import { defaultFontSize } from "../../../../editor/model/factories";
import type { Rgba } from "../../../../editor/model/types";
import { documentPointAtViewCenter } from "../../../../editor/stage/viewStore";
import {
  editorStore,
  useEditorStore,
} from "../../../../editor/store/editorStore";
import {
  selectSelectedElement,
  selectSelectedText,
} from "../../../../editor/store/selectors";
import { InsertHelpDialog, useInsertImage } from "../../../images";
import { SHORTCUT_LABELS } from "../../../shortcuts";
import TextPanel from "../TextPanel/TextPanel";
import styles from "./TextToolbar.module.css";

/** Color que se ve en el botón cuando no hay texto seleccionado. */
const NO_COLOR: Rgba = { r: 0, g: 0, b: 0, a: 0 };

/**
 * Crea un texto y abre el editor para escribirlo. La posición de partida es
 * el centro de lo que se ve, pero no cuenta: al terminar de escribir, el texto
 * se queda donde estaba el editor (ver `newTextPosition`).
 */
const addTextAtViewCenter = () => {
  const { addText, startTextEditing, canvasSize } = editorStore.getState();
  const id = addText(documentPointAtViewCenter(), defaultFontSize(canvasSize));
  startTextEditing(id);
};

/**
 * Barra del modo Texto: añadir texto, fuente y estilo, color, eliminar y el
 * menú "Más opciones" (qué se puede insertar e insertar un archivo). Fuente,
 * estilo y color se aplican al texto seleccionado.
 */
const TextToolbar = () => {
  const selectedText = useEditorStore(selectSelectedText);
  const selectedElement = useEditorStore(selectSelectedElement);
  const editElement = useEditorStore((state) => state.editElement);
  const removeElement = useEditorStore((state) => state.removeElement);
  const [isTextPanelOpen, setIsTextPanelOpen] = useState(false);
  const [isInsertHelpOpen, setIsInsertHelpOpen] = useState(false);

  const { pickImage, fileInput } = useInsertImage();

  const font = getFont(selectedText?.fontId ?? "normal");

  const moreOptions: MenuItem[] = [
    {
      label: "¿Qué puedo insertar?",
      icon: CircleQuestionMark,
      onSelect: () => setIsInsertHelpOpen(true),
      hasSeparatorAfter: true,
    },
    {
      label: "Insertar archivo",
      icon: ImagePlus,
      onSelect: pickImage,
    },
  ];

  return (
    <>
      <IconButton
        icon={Type}
        aria-label="Agregar texto"
        onClick={addTextAtViewCenter}
      />
      <Tooltip label="Fuente y estilo">
        <Button
          size="sm"
          className={styles.fontButton}
          style={{ fontFamily: font.family }}
          disabled={!selectedText}
          aria-haspopup="dialog"
          aria-label={`Fuente: ${font.label}`}
          onClick={() => setIsTextPanelOpen(true)}
        >
          {font.label}
        </Button>
      </Tooltip>
      <ColorControl
        label="Color del texto"
        color={selectedText?.color ?? NO_COLOR}
        disabled={!selectedText}
        hasAlpha
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
      <Menu
        side="top"
        trigger={
          <IconButton icon={EllipsisVertical} aria-label="Más opciones" />
        }
        items={moreOptions}
      />
      {fileInput}
      <InsertHelpDialog
        open={isInsertHelpOpen}
        onOpenChange={setIsInsertHelpOpen}
      />
      <Panel
        open={isTextPanelOpen && selectedText !== null}
        onOpenChange={setIsTextPanelOpen}
        title="Fuente y estilo"
      >
        {selectedText && <TextPanel text={selectedText} />}
      </Panel>
    </>
  );
};

export default TextToolbar;
