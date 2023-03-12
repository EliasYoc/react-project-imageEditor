import { useContext } from "react";
import { FiX } from "react-icons/fi";
import { GrUndo } from "react-icons/gr";
import { BiDownload } from "react-icons/bi";
import { ContextConfiguration } from "../../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../../context/ToolBoxesProvider";
import { GlobalButton, LayoutToolBox } from "../../../utils/styledComponents";
import {
  deleteCanvasWithTransparency,
  paintWholeCanvas,
} from "../../../utils/canvas";

const HeaderChildren = () => {
  const {
    openOptionPage,
    ctx,
    canvasSize,
    $canvas,
    principalImageLoaded,
    refGlobalDrawingLogs,
    drawingHistoryLength,
    setDrawingHistoryLength,
  } = useContext(ContextConfiguration);
  const { setFullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const downloadImageCanvas = () => {
    const $canvasLayer = document.createElement("canvas");
    if (principalImageLoaded) {
      $canvasLayer.width = canvasSize.width;
      $canvasLayer.height = canvasSize.height;
      const layerCtx = $canvasLayer.getContext("2d");
      // ctx.globalCompositeOperation = "source-over";
      layerCtx.drawImage(
        principalImageLoaded,
        0,
        0,
        canvasSize.width,
        canvasSize.height
      );
      for (const action of refGlobalDrawingLogs.current) {
        // ctx.globalCompositeOperation = action.transparentEraser;
        if (action.whatTask === "painting") {
          // const { r, g, b, a } = action.color;
          // ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${a || 0})`;
          // ctx.lineWidth = action.size || 50;
          // ctx.beginPath();
          // for (const { coordX, coordY } of action.data) {
          //   ctx.lineTo(coordX, coordY);
          //   ctx.stroke();
          // }
        }
        if (action.whatTask === "adding_image") {
        }
      }
      layerCtx.drawImage($canvas, 0, 0, canvasSize.width, canvasSize.height);
    }
    const anchor = document.createElement("a");
    anchor.href = principalImageLoaded
      ? $canvasLayer.toDataURL("image/png")
      : $canvas.toDataURL("image/png");
    anchor.download = "IMAGE";
    anchor.click();
    anchor.remove();
  };
  const handleClickUndo = () => {
    if (!refGlobalDrawingLogs.current.length) return;
    refGlobalDrawingLogs.current.pop();
    principalImageLoaded
      ? deleteCanvasWithTransparency({
          currentCtx: ctx,
          canvasWidth: $canvas.width,
          canvasHeight: $canvas.height,
        })
      : paintWholeCanvas(ctx, "white", $canvas.width, $canvas.height);
    refGlobalDrawingLogs.current.forEach((drawingLog) => {
      if (drawingLog.whatTask === "painting") {
        const { r, g, b, a } = drawingLog.color;
        const { coordX, coordY } = drawingLog.data[0];
        ctx.globalCompositeOperation = drawingLog.transparentEraser;
        ctx.lineWidth = drawingLog.size;
        ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${a || 0})`;
        ctx.beginPath();
        ctx.moveTo(coordX, coordY);
        drawingLog.data.forEach((coords) => {
          ctx.lineTo(coords.coordX, coords.coordY);
          ctx.stroke();
        });
      }
      if (drawingLog.whatTask === "paintingWholeCanvas") {
        drawingLog.transparentEraser === "destination-out"
          ? deleteCanvasWithTransparency({
              currentCtx: ctx,
              canvasWidth: $canvas.width,
              canvasHeight: $canvas.height,
            })
          : paintWholeCanvas(
              ctx,
              drawingLog.canvasColor,
              $canvas.width,
              $canvas.height
            );
      }
    });
    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
  };

  const handleDeleteCanvas = () => {
    principalImageLoaded
      ? deleteCanvasWithTransparency({
          currentCtx: ctx,
          canvasWidth: $canvas.width,
          canvasHeight: $canvas.height,
        })
      : paintWholeCanvas(ctx, "white", $canvas.width, $canvas.height);
    refGlobalDrawingLogs.current = [];
    setDrawingHistoryLength(0);
  };
  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        {drawingHistoryLength ? (
          <GlobalButton onClick={handleClickUndo}>
            <GrUndo />
          </GlobalButton>
        ) : null}
        <span style={{ fontSize: "14px" }}>{drawingHistoryLength}</span>
      </div>
      <LayoutToolBox
        backgroundColor="transparent"
        width="auto"
        gap=".5rem"
        display="flex"
        margin="0"
        position="relative"
      >
        {drawingHistoryLength ? (
          <GlobalButton
            onClick={handleDeleteCanvas}
            width="100%"
            height="auto"
            borderRadius="1rem"
            fontSize="14px"
          >
            Borrar Todo
          </GlobalButton>
        ) : null}

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
