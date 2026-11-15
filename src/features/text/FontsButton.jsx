import { useState } from "react";
import {
  FixedContainer,
  GlobalButton,
} from "../../components/ui/legacy/styledComponents";
import { FONTS, getFont } from "../../editor/elements/fonts";
import { DEFAULT_TEXT_STYLE } from "../../editor/model/factories";
import { useEditorStore } from "../../editor/store/editorStore";
import { selectSelectedText } from "../../editor/store/selectors";
import { FontBox, FontInput, FontLabel } from "./FontsButton.styles";

const FontsButton = () => {
  const selectedText = useEditorStore(selectSelectedText);
  const editElement = useEditorStore((state) => state.editElement);
  const [isOpen, setIsOpen] = useState(false);

  // Derivado en el render: no hace falta un estado + useEffect para esto.
  const isDisabled = selectedText === null;
  const { fontId } = selectedText ?? DEFAULT_TEXT_STYLE;
  const { label: fontName, family: fontFamily } = getFont(fontId);

  const handleSelectFont = (font) => {
    editElement(selectedText.id, { fontId: font.id });
    setIsOpen(false);
  };

  return (
    <GlobalButton
      onClick={() => setIsOpen(!isOpen)}
      width="96px"
      height="auto"
      fontSize="1rem"
      border="1px solid gray"
      overflow="visible"
      backgroundColor={isDisabled ? "#4d4c4c" : "transparent"}
      style={{ pointerEvents: isDisabled ? "none" : "auto", fontFamily }}
    >
      <span
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {fontName}
      </span>
      <FixedContainer
        zIndex={-1}
        className={isOpen ? "" : "close"}
      ></FixedContainer>
      <FontBox className={isOpen ? "open" : ""}>
        <div
          style={{
            overflow: "scroll",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {FONTS.map((font) => (
            <FontLabel
              key={font.id}
              fontFamily={font.family}
              htmlFor={`font-${font.id}`}
            >
              <FontInput
                checked={fontId === font.id}
                onChange={() => handleSelectFont(font)}
                name="font"
                id={`font-${font.id}`}
                type="radio"
                value={font.id}
              ></FontInput>
              {font.label}
            </FontLabel>
          ))}
        </div>
      </FontBox>
    </GlobalButton>
  );
};

export default FontsButton;
