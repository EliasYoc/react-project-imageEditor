import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  applyDraggableTextFontFamily,
  applyDraggableTextFontSize,
  selectDraggableTextFontFamily,
  selectDraggableTextId,
  selectRangeValues,
  setPencilSizeForRangeSlider,
} from "../../../features/paintingSlice";
import { FixedContainer, GlobalButton } from "../../../utils/styledComponents";
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
  const { minValue, maxValue } = useSelector(selectRangeValues);
  const [isOpen, setIsOpen] = useState(false);
  const refFontBox = useRef();
  // selectedFont must be global and added to useFullSizeDependencies dependencies of Detectabletoolbox...
  const [selectedFontName, setSelectedFontName] = useState("Normal");

  const draggableTextList = document.querySelectorAll(".draggableText");
  const hasDraggableTexts = draggableTextList.length > 0;

  useEffect(
    function applyDraggableTextConfiguration() {
      if (draggableTextId) {
        const $draggableText = document.getElementById(draggableTextId);
        setSelectedFontName($draggableText.dataset.fontName || "Normal");
        dispatch(
          applyDraggableTextFontFamily(
            $draggableText.dataset.fontFamily || fonts[0].font
          )
        );

        const fontSizeForRange =
          maxValue + minValue - ($draggableText.dataset.fontSize || 22);
        dispatch(setPencilSizeForRangeSlider(fontSizeForRange));

        dispatch(
          applyDraggableTextFontSize($draggableText.dataset.fontSize || 22)
        );
      }
    },
    [draggableTextId, dispatch, maxValue, minValue]
  );

  const handleSelectFont = (e) => {
    const $draggableElementText = document.getElementById(draggableTextId);
    $draggableElementText.style.fontFamily = e.target.value;
    $draggableElementText.dataset.fontName = e.target.dataset.fontName;
    $draggableElementText.dataset.fontFamily = e.target.value;
    setSelectedFontName(e.target.dataset.fontName);
    dispatch(applyDraggableTextFontFamily(e.target.value));
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
      style={{ pointerEvents: hasDraggableTexts ? "auto" : "none", fontFamily }}
    >
      {selectedFontName}
      <FixedContainer
        zIndex={-1}
        className={isOpen ? "" : "close"}
      ></FixedContainer>
      <FontBox ref={refFontBox} className={`${isOpen ? "open" : ""}`}>
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
                  checked={selectedFontName === font.label}
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
