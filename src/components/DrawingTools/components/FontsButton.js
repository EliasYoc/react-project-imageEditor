import React, { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { selectDraggableTextId } from "../../../features/paintingSlice";
import { GlobalButton } from "../../../utils/styledComponents";
import { FontBox, FontInput, FontLabel } from "../styles";
const fonts = [
  {
    label: "Normal",
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
  },
  {
    label: "Caveat",
    font: "caveat",
  },
  {
    label: "Raleway",
    font: "raleway",
  },
  {
    label: "Rubik",
    font: "rubik",
  },
  {
    label: "Cinzel",
    font: "cinzel",
  },
  {
    label: "Comfortaa",
    font: "comfortaa",
  },
  {
    label: "Dancing Script",
    font: "dancing-script",
  },
  {
    label: "Source Code Pro",
    font: "source-code-pro",
  },
  {
    label: "Shantell Sans",
    font: "shantell-sans",
  },
];
const FontsButton = ({ onClick }) => {
  const { refMoveable } = useContext(ContextConfiguration);
  const [isOpen, setIsOpen] = useState(false);
  const draggableTextId = useSelector(selectDraggableTextId);
  const draggableTextList = document.querySelectorAll(".draggableText");
  const hasDraggableTexts = draggableTextList.length > 0;
  const handleSelectFont = (e) => {
    draggableTextList.forEach((draggableText) => {
      if (draggableText.id === draggableTextId) {
        draggableText.style.fontFamily = e.target.value;
      }
    });
    refMoveable.current.updateRect();
    setIsOpen(false);
  };
  return (
    <GlobalButton
      onClick={() => setIsOpen(!isOpen)}
      width="auto"
      height="auto"
      fontSize="1rem"
      border="1px solid gray"
      overflow="visible"
      backgroundColor={`${hasDraggableTexts ? "transparent" : "#4d4c4c"}`}
      style={{ pointerEvents: hasDraggableTexts ? "auto" : "none" }}
    >
      Normal
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
              <FontLabel fontFamily={font.font} htmlFor={font.label}>
                <FontInput
                  onChange={handleSelectFont}
                  name="font"
                  id={font.label}
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
