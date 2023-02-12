import { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import {
  selectKindOfPencil,
  selectPencilSizeForRange,
  selectPencilType,
} from "../../features/paintingSlice";
import { getCalculatedCoordsOfContainCanvas } from "../../utils/canvas";
import PixelRange from "../PixelRange/PixelRange";
// const paintPixelByPixelCanvasExample = (canvasSize, ctx) => {
//   for (var x = 0; x < canvasSize.width; x++) {
//     for (var y = 0; y < canvasSize.height; y++) {
//       ctx.fillStyle = "#" + Math.floor(Math.random() * 16777215).toString(16); // pick random color
//       ctx.fillRect(x, y, 1, 1); // draw pixel on canvas
//     }
//   }
// };
export const canvasSize = {
  width: 1080,
  height: 1920,
};
const Canvas = () => {
  const { fullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const { isDrawingToolsOpen, refCanvas, ctx } =
    useContext(ContextConfiguration);
  const pencilType = useSelector(selectPencilType);
  const kindOfPencilStyle = useSelector(selectKindOfPencil);
  const pencilSizeForRange = useSelector(selectPencilSizeForRange);
  let isPainting = false;

  useEffect(
    function painting() {
      if (!ctx) return;

      // const canvasStyleText = {
      //   canvasFontSize: 240,
      //   positionX: 0,
      //   positionY: 0,
      // };
      console.log("painting canvas");
      //painting canvas
      ctx.fillStyle = "white";

      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      //creating the text's background
      // ctx.fillStyle = "#fff";
      // ctx.fillRect(
      //   canvasStyleText.positionX,
      //   canvasStyleText.positionY,
      //   40,
      //   canvasStyleText.canvasFontSize
      // );

      //designing text
      // ctx.font = `${canvasStyleText.canvasFontSize}px Comic Sans Ms`;
      // ctx.fillStyle = "#000";
      // ctx.fillText(
      //   "Elías Yoc",
      //   canvasStyleText.positionX,
      //   canvasStyleText.positionY + canvasStyleText.canvasFontSize
      // );
      if (isDrawingToolsOpen) {
        console.log(ctx);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // $canvas.addEventListener("mousedown", listenerStartPaiting);
        // $canvas.addEventListener("touchstart", listenerStartPaiting);
        // $canvas.addEventListener("mousemove", listenerPainting);
        // $canvas.addEventListener("touchmove", listenerPainting);
        // $canvas.addEventListener("touchend", listenerStopPainting);
        // $canvas.addEventListener("mouseup", listenerStopPainting);
      }
      return () => {
        // $canvas.removeEventListener("mousedown", listenerStartPaiting);
        // $canvas.removeEventListener("touchstart", listenerStartPaiting);
        // $canvas.removeEventListener("mousemove", listenerStartPaiting);
        // $canvas.removeEventListener("touchmove", listenerStartPaiting);
        // $canvas.removeEventListener("touchend", listenerStopPainting);
        // $canvas.removeEventListener("mouseup", listenerStopPainting);
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      };
    },
    [isDrawingToolsOpen, ctx]
  );
  const listenerStartPaiting = (e) => {
    if (!isDrawingToolsOpen) return;
    console.warn("starting painting");
    const { color, size } = kindOfPencilStyle[pencilType];
    const { r, g, b, a } = color;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})` || "black";
    ctx.lineWidth = size || 50;
    ctx.beginPath();
    const xCoordMouseOrTouch = e.clientX || e.touches[0].clientX;
    const yCoordMouseOrTouch = e.clientY || e.touches[0].clientY;

    const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
      canvasElement: refCanvas.current,
      xCoord: xCoordMouseOrTouch,
      yCoord: yCoordMouseOrTouch,
      canvasWidhtPixel: canvasSize.width,
      canvasHeightPixel: canvasSize.height,
    });
    ctx.moveTo(coordX, coordY);
    isPainting = true;
  };
  const listenerPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    if (isPainting) {
      console.log("mouse or touch");
      const xCoordMouseOrTouch = e.clientX || e.touches[0].clientX;
      const yCoordMouseOrTouch = e.clientY || e.touches[0].clientY;
      const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
        canvasElement: refCanvas.current,
        xCoord: xCoordMouseOrTouch,
        yCoord: yCoordMouseOrTouch,
        canvasWidhtPixel: canvasSize.width,
        canvasHeightPixel: canvasSize.height,
      });
      ctx.lineTo(coordX, coordY);
      ctx.stroke();
    }
  };
  const listenerStopPainting = () => {
    if (!isDrawingToolsOpen) return;
    console.log("up");
    // ctx.stroke();

    isPainting = false;
  };
  return (
    <>
      {isDrawingToolsOpen && (
        <PixelRange
          pixelSize={pencilSizeForRange}
          minValue={15}
          maxValue={200}
        />
      )}
      <canvas
        onMouseDown={listenerStartPaiting}
        onTouchStart={listenerStartPaiting}
        onMouseMove={listenerPainting}
        onTouchMove={listenerPainting}
        onMouseUp={listenerStopPainting}
        onTouchEnd={listenerStopPainting}
        id="myCanvas"
        ref={refCanvas}
        className="principal-canvas"
        style={{
          width: "100%",
          height: `calc(100% - ${fullHeightSumForCanvas || "0px"})`,
          objectFit: "contain",
          transition: "height .3s ease",
          // imageRendering: "pixelated",
        }}
        width={canvasSize.width}
        height={canvasSize.height}
      >
        canvas editor
      </canvas>
    </>
  );
};

export default Canvas;
