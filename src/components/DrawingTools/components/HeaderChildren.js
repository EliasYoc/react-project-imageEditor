import { useContext } from "react";
import { FiX } from "react-icons/fi";
import { GrUndo } from "react-icons/gr";
import { BiImageAlt, BiDownload } from "react-icons/bi";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../../context/ToolBoxesProvider";
import { GlobalButton, LayoutToolBox } from "../../../utils/styledComponents";
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
      <GlobalButton>
        <GrUndo />
      </GlobalButton>
      <LayoutToolBox
        backgroundColor="transparent"
        width="auto"
        gap=".5rem"
        display="flex"
        margin="0"
        position="relative"
      >
        <GlobalButton
          onClick={() => deleteCanvas({ currentCtx: ctx, canvasSize })}
          width="100%"
          height="auto"
          borderRadius="1rem"
        >
          Borrar Todo
        </GlobalButton>

        <GlobalButton onClick={downloadImageCanvas} flexShrink="0">
          <BiDownload />
        </GlobalButton>
        <GlobalButton flexShrink="0">
          <BiImageAlt />
        </GlobalButton>
        <GlobalButton
          flexShrink="0"
          borderRadius="1rem"
          onClick={() => {
            setFullHeightSumForCanvas("0px");
            openOptionPage({ isPrincipalToolsOpen: true });
          }}
        >
          <FiX />
        </GlobalButton>
      </LayoutToolBox>
    </>
  );
};

export default HeaderChildren;
