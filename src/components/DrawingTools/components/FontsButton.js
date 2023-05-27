import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  applyDraggableTextFontFamily,
  selectDraggableTextFontFamily,
  selectDraggableTextId,
} from "../../../features/paintingSlice";
import { GlobalButton } from "../../../utils/styledComponents";
import { FontBox, FontInput, FontLabel } from "../styles";
const fonts = [
  {
    id: "normal",
    label: "Normal",
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
  },
  {
    id: "caveat",
    label: "Caveat",
    font: "caveat",
  },
  {
    id: "raleway",
    label: "Raleway",
    font: "raleway",
  },
  {
    id: "rubik",
    label: "Rubik",
    font: "rubik",
  },
  {
    id: "cinzel",
    label: "Cinzel",
    font: "cinzel",
  },
  {
    id: "comfortaa",
    label: "Comfortaa",
    font: "comfortaa",
  },
  {
    id: "dancingScript",
    label: "Dancing Script",
    font: "dancing-script",
  },
  {
    id: "sourceCodePro",
    label: "Source Code Pro",
    font: "source-code-pro",
  },
  {
    id: "shantellSans",
    label: "Shantell Sans",
    font: "shantell-sans",
  },
];
const FontsButton = ({ onClick }) => {
  const dispatch = useDispatch();
  const fontFamily = useSelector(selectDraggableTextFontFamily);
  const draggableTextId = useSelector(selectDraggableTextId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Normal");
  const draggableTextList = document.querySelectorAll(".draggableText");
  const hasDraggableTexts = draggableTextList.length > 0;

  const handleSelectFont = (e) => {
    const $draggableElementText = document.getElementById(draggableTextId);
    $draggableElementText.style.fontFamily = e.target.value;
    setSelectedFont(e.target.dataset.fontName);
    dispatch(applyDraggableTextFontFamily(e.target.value));
    setIsOpen(false);
  };
  console.log("consolelog");
  return (
    <GlobalButton
      onClick={() => setIsOpen(!isOpen)}
      width="auto"
      height="auto"
      fontSize="1rem"
      border="1px solid gray"
      overflow="visible"
      backgroundColor={`${hasDraggableTexts ? "transparent" : "#4d4c4c"}`}
      style={{ pointerEvents: hasDraggableTexts ? "auto" : "none", fontFamily }}
    >
      {selectedFont}
      <FontBox className={`${isOpen ? "open" : ""}`}>
        <div
          style={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {fonts.map((font) => (
            <>
              <FontLabel fontFamily={font.font} htmlFor={font.id}>
                <FontInput
                  data-font-name={font.label}
                  onChange={handleSelectFont}
                  name="font"
                  id={font.id}
                  type="radio"
                  value={font.font}
                ></FontInput>
                {font.label}
              </FontLabel>
            </>
          ))}
        </div>
      </FontBox>
    </GlobalButton>
  );
};

export default FontsButton;