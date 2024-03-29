import { useContext, useState } from "react";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import ButtonTool from "../ButtonTool";
import { BiPaint, BiSprayCan } from "react-icons/bi";
import { BsEraser } from "react-icons/bs";
import { themeColor } from "../../context/ConfigurationProvider";
import PortalsSwipeableMenuLayout from "../Layout/PortalsSwipeableMenuLayout";
import ColorPickerMenu from "../ColorPickerMenu/ColorPickerMenu";
import {
  GlobalButton,
  PencilBackgroundColor,
} from "../../utils/styledComponents";
import { useSelector } from "react-redux";
import {
  selectKindOfPencil,
  selectPencilType,
} from "../../features/paintingSlice";

const DrawingTools = () => {
  const { activeButtonPosition } = useContext(ContextToolBoxes);
  const [isOpenPortalsDrawingModal, setIsOpenPortalsDrawingModal] =
    useState(false);
  const kindOfPencil = useSelector(selectKindOfPencil);
  const pencilType = useSelector(selectPencilType);
  const { r, g, b, a } = kindOfPencil[pencilType].color;

  const handleOpenCloseModal = () => {
    if (pencilType === "eraser") return;
    setIsOpenPortalsDrawingModal(!isOpenPortalsDrawingModal);
  };
  return (
    <>
      <GlobalButton
        backgroundColor={themeColor.activeBgColor}
        position="absolute"
        width={activeButtonPosition.width}
        height={activeButtonPosition.height}
        left={activeButtonPosition.left}
        zIndex="1"
      />
      <ButtonTool
        icon={BiPaint}
        htmlFor="normal"
        name="drawingTools"
        selectedButton
      />
      <ButtonTool icon={BiSprayCan} htmlFor="spray" name="drawingTools" />
      {/* <ButtonTool icon={BiPaint} htmlFor="chalk" name="drawingTools" /> */}
      <ButtonTool icon={BsEraser} htmlFor="eraser" name="drawingTools" />
      {/* The size of individual squares should be specified in the background-position property that should be twice smaller than background-size. */}
      <GlobalButton
        border={`3px solid ${themeColor.textColor}`}
        backgroundColor="#eee"
        backgroundImage="linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0),
                  linear-gradient(45deg, rgba(0,0,0,.25) 25%,
                  transparent 0, transparent 75%, rgba(0,0,0,.25) 0);"
        backgroundPosition="0 0, 7.5px 7.5px"
        backgroundSize="15px 15px"
        onClick={handleOpenCloseModal}
        padding="0"
      >
        <PencilBackgroundColor
          style={{
            border: `4px solid black`,
            borderRadius: "50px",
          }}
          backgroundColor={`rgba(${r}, ${g},${b},${a} )`}
        />
      </GlobalButton>

      <PortalsSwipeableMenuLayout
        title="Escoge un color individual"
        isOpen={isOpenPortalsDrawingModal}
        onClose={handleOpenCloseModal}
      >
        <ColorPickerMenu />
      </PortalsSwipeableMenuLayout>
    </>
  );
};

export default DrawingTools;
