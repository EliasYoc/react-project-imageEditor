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
  {
    id: "lobsterTwo",
    label: "Lobster Two",
    font: "Lobster Two",
  },
  {
    id: "pacifico",
    label: "Pacifico",
    font: "Pacifico",
  },
  {
    id: "indieFlower",
    label: "Indie Flower",
    font: "Indie Flower",
  },
  {
    id: "kablammo",
    label: "Kablammo",
    font: "Kablammo",
  },
  {
    id: "kalam",
    label: "Kalam",
    font: "Kalam",
  },
  {
    id: "permanentMarker",
    label: "Permanent Marker",
    font: "Permanent Marker",
  },
  {
    id: "pressStart2p",
    label: "Press Start 2P",
    font: "'Press Start 2P'",
  },
  {
    id: "specialElite",
    label: "Special Elite",
    font: "Special Elite",
  },
  {
    id: "hennyPenny",
    label: "Henny Penny",
    font: "Henny Penny",
  },
  {
    id: "jajaja",
    label: "jajaja",
    font: "jajaja",
  },
];
const FontsButton = ({ onClick }) => {
  const dispatch = useDispatch();
  const fontFamily = useSelector(selectDraggableTextFontFamily);
  const draggableTextId = useSelector(selectDraggableTextId);
  const { minValue, maxValue } = useSelector(selectRangeValues);
  const [isOpen, setIsOpen] = useState(false);
  const [disableButton, setDisableButton] = useState(true);
  const refFontBox = useRef();
  // selectedFont must be global and added to useFullSizeDependencies dependencies of Detectabletoolbox...
  const [selectedFontName, setSelectedFontName] = useState("Normal");

  const draggableTextList = document.querySelectorAll(".draggableText");
  const hasDraggableTexts = draggableTextList.length > 0;

  useEffect(
    function applyDraggableTextConfiguration() {
      if (draggableTextId) {
        const $draggableText = document.getElementById(draggableTextId);
        if (
          $draggableText.classList.contains("draggableText") &&
          hasDraggableTexts
        ) {
          setDisableButton(false);
        } else {
          setDisableButton(true);
        }

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
    [draggableTextId, dispatch, maxValue, minValue, hasDraggableTexts]
  );

  const handleSelectFont = (e) => {
    const $draggableElementText = document.getElementById(draggableTextId);
    console.log(e.target.value);
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
      width="120px"
      height="auto"
      fontSize="1rem"
      border="1px solid gray"
      overflow="visible"
      backgroundColor={`${!disableButton ? "transparent" : "#4d4c4c"}`}
      style={{ pointerEvents: !disableButton ? "auto" : "none", fontFamily }}
    >
      <span
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {selectedFontName}
      </span>
      <FixedContainer
        zIndex={-1}
        className={isOpen ? "" : "close"}
      ></FixedContainer>
      <FontBox ref={refFontBox} className={`${isOpen ? "open" : ""}`}>
        <div
          style={{
            overflow: "scroll",
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
