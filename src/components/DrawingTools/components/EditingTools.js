import React, { useContext, useState, useEffect } from "react";
import {
  ContextConfiguration,
  themeColor,
} from "../../../context/ConfigurationProvider";
import {
  GlobalButton,
  PencilBackgroundColor,
} from "../../../utils/styledComponents";
import { v4 as uuidv4 } from "uuid";
import PortalsSwipeableMenuLayout from "../../Layout/PortalsSwipeableMenuLayout";
import { useDispatch, useSelector } from "react-redux";
import {
  applyDraggableTextColor,
  selectDraggableTextColor,
  selectDraggableTextId,
} from "../../../features/paintingSlice";
import { RgbaColorPicker } from "react-colorful";
import { debounce } from "../../../utils/helper";
import FontsButton from "./FontsButton";
import BoldButton from "./BoldButton";
import IncludeImageButton from "./IncludeImageButton";

const EditingTools = () => {
  const { refGlobalDrawingLogs, setDrawingHistoryLength } =
    useContext(ContextConfiguration);
  const color = useSelector(selectDraggableTextColor);
  const draggableTextId = useSelector(selectDraggableTextId);
  const dispatch = useDispatch();
  const [isOpenPortalsEditingModal, setIsOpenPortalsEditingModal] =
    useState(false);
  const [disablePickColorButton, setDisablePickColorButton] = useState(true);

  useEffect(() => {
    if (draggableTextId) {
      const draggableTextList = document.querySelectorAll(".draggableText");
      const hasDraggableTexts = draggableTextList.length > 0;

      const draggableText = document.getElementById(draggableTextId);
      if (
        draggableText.classList.contains("draggableText") &&
        hasDraggableTexts
      ) {
        setDisablePickColorButton(false);
      } else {
        setDisablePickColorButton(true);
      }
    }
  }, [draggableTextId]);

  useEffect(
    function updatePickerTextColor() {
      if (draggableTextId) {
        const $draggable = document.getElementById(draggableTextId);
        const indexOfFirstParenthesis = $draggable.style.color.indexOf("(");
        const indesOfLastParenthesis = -1;
        const arrColor = $draggable.style.color
          .slice(indexOfFirstParenthesis + 1, indesOfLastParenthesis)
          .split(", ");

        const objColor = {
          r: parseInt(arrColor[0] || 0),
          g: parseInt(arrColor[1] || 0),
          b: parseInt(arrColor[2] || 0),
          a: !arrColor[3] ? 1 : parseInt(arrColor[3]),
        };
        dispatch(applyDraggableTextColor(objColor));
      }
    },
    [draggableTextId, dispatch]
  );

  const handleAddText = () => {
    const initialDraggableElement = {
      id: uuidv4(),
      color: { r: 0, g: 0, b: 0, a: 1 },
      background: { r: 255, g: 255, b: 255, a: 1 },
      whatTask: "draggableText",
      size: 12,
      scale: [1, 1],
      translate: [0, 0],
      left: null,
      top: null,
      realLeft: null,
      realTop: null,
      offsetLeft: null,
      offsetTop: null,
      realWidth: null,
      realHeight: null,
      initialWidth: null,
      initialHeight: null,
    };
    refGlobalDrawingLogs.current.push(initialDraggableElement);
    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
  };

  const handleOpenEditingModal = () => {
    if (disablePickColorButton) return;
    setIsOpenPortalsEditingModal(!isOpenPortalsEditingModal);
  };

  const hanldleApplyColor = ({ r, g, b, a }) => {
    const $draggable = document.getElementById(draggableTextId);
    $draggable.style.color = `rgba(${r}, ${g}, ${b}, ${a})`;

    saveColor({ r, g, b, a });
  };

  const saveColor = debounce(({ r, g, b, a }) => {
    dispatch(applyDraggableTextColor({ r, g, b, a }));
  }, 300);

  return (
    <>
      <GlobalButton
        onClick={handleAddText}
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
        onClick={handleOpenEditingModal}
        padding="0"
      >
        <PencilBackgroundColor
          style={{
            border: `4px solid black`,
            borderRadius: "50px",
          }}
          backgroundColor={
            disablePickColorButton
              ? "transparent"
              : `rgba(${color.r}, ${color.g},${color.b},${color.a} )`
          }
        />
      </GlobalButton>
      <PortalsSwipeableMenuLayout
        title="Escoge un color individual"
        isOpen={isOpenPortalsEditingModal}
        onClose={handleOpenEditingModal}
      >
        <RgbaColorPicker color={color} onChange={hanldleApplyColor} />
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default EditingTools;
