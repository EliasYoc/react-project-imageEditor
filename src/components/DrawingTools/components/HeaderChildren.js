import { useContext } from "react";
import { FiX } from "react-icons/fi";
import { GrUndo } from "react-icons/gr";
import { BiImageAlt, BiDownload } from "react-icons/bi";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../../context/ToolBoxesProvider";
import { LayoutToolBox } from "../../../utils/styledComponents";
import { StyledButton } from "../../ButtonTool/styles";
import { deleteCanvas } from "../../../utils/canvas";
import { canvasSize } from "../../Canvas";

const HeaderChildren = () => {
  const { openOptionPage, ctx } = useContext(ContextConfiguration);
  const { setFullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const downloadImageCanvas = () => {
    const $canvas = document.getElementById("myCanvas");
    const anchor = document.createElement("a");
    anchor.href = $canvas.toDataURL("image/png");
    anchor.download = "IMAGE.PNG";
    anchor.click();
    anchor.remove();
  };
  return (
    <>
      <StyledButton>
        <GrUndo />
      </StyledButton>
      <LayoutToolBox
        backgroundColor="transparent"
        width="auto"
        gap=".5rem"
        display="flex"
        margin="0"
        position="relative"
      >
        <StyledButton
          onClick={() => deleteCanvas({ currentCtx: ctx, canvasSize })}
          width="100%"
          height="auto"
          borderRadius="1rem"
        >
          Borrar Todo
        </StyledButton>

        <StyledButton onClick={downloadImageCanvas} flexShrink="0">
          <BiDownload />
        </StyledButton>
        <StyledButton flexShrink="0">
          <BiImageAlt />
        </StyledButton>
        <StyledButton
          flexShrink="0"
          borderRadius="1rem"
          onClick={() => {
            setFullHeightSumForCanvas("0px");
            openOptionPage({ isPrincipalToolsOpen: true });
          }}
        >
          <FiX />
        </StyledButton>
      </LayoutToolBox>
    </>
  );
};

export default HeaderChildren;
