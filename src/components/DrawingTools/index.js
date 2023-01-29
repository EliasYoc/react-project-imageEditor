import { useContext, useEffect } from "react";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import ButtonTool from "../ButtonTool";
import { StyledButton } from "../ButtonTool/styles";
import { BiPaint } from "react-icons/bi";
import ToolBox from "../ToolBox";
import useFullSizeElement from "../../hooks/useFullSizeElement";
import { themeColor } from "../../context/ConfigurationProvider";

const DrawingTools = () => {
  const { activeButtonPosition, handleSumHeightForCanvas } =
    useContext(ContextToolBoxes);
  const { refElement: refDrawingToolBox, elementSize } = useFullSizeElement();
  useEffect(() => {
    // setChangedHeightForCanvas(elementSize.height);
    console.log(elementSize);
    if (elementSize) {
      const { height, marginTop, marginBottom } = elementSize;
      handleSumHeightForCanvas(height, marginTop, marginBottom);
    }
  }, [elementSize, handleSumHeightForCanvas]);
  console.log("drawing tools");

  return (
    <div ref={refDrawingToolBox}>
      <ToolBox
        display="flex"
        justifyContent="space-around"
        borderRadius="50px"
        position="relative"
        margin="10px auto"
      >
        <StyledButton
          backgroundColor={themeColor.activeBgColor}
          position="absolute"
          width={activeButtonPosition.width}
          height={activeButtonPosition.height}
          left={activeButtonPosition.left}
          zIndex="1"
        />
        <ButtonTool
          icon={BiPaint}
          htmlFor="paint"
          name="principalTools"
          active
        />
        <ButtonTool icon={BiPaint} htmlFor="crop" name="principalTools" />
        <ButtonTool icon={BiPaint} htmlFor="text" name="principalTools" />
        <ButtonTool htmlFor="color" name="principalTools">
          <p>a</p>
        </ButtonTool>
      </ToolBox>
    </div>
  );
};

export default DrawingTools;
