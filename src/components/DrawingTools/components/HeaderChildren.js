import { useContext } from "react";
import { FiX } from "react-icons/fi";
import { GrUndo } from "react-icons/gr";
import { BiDownload } from "react-icons/bi";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../../context/ToolBoxesProvider";
import { GlobalButton, LayoutToolBox } from "../../../utils/styledComponents";
import { deleteCanvas } from "../../../utils/canvas";

const HeaderChildren = () => {
  const {
    openOptionPage,
    ctx,
    canvasSize,
    $canvas,
    principalImageLoaded,
    refGlobalDrawingLogs,
  } = useContext(ContextConfiguration);
  const { setFullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const downloadImageCanvas = () => {
    // todo  redraw bgimage of canvas in the canvas and redraw paths saved im array coords
    if (principalImageLoaded) {
      // becaus of eraser(destination-out) i need to change the value to source-over
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(
        principalImageLoaded,
        0,
        0,
        canvasSize.width,
        canvasSize.height
      );
      for (const action of refGlobalDrawingLogs.current) {
        console.log(action);
        ctx.globalCompositeOperation = action.transparentEraser;

        if (action.whatTask === "painting") {
          const { r, g, b, a } = action.color;
          ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${a || 0})`;
          ctx.lineWidth = action.size || 50;
          ctx.beginPath();
          for (const { coordX, coordY } of action.data) {
            ctx.lineTo(coordX, coordY);
            ctx.stroke();
          }
        }
        if (action.whatTask === "adding_image") {
        }
        if (action.whatTask === "erasing_transparent") {
        }
      }
    }
    const anchor = document.createElement("a");
    anchor.href = $canvas.toDataURL("image/png");
    anchor.download = "IMAGE";
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
