import { useRef } from "react";
import { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import {
  selectKindOfPencil,
  selectPencilSizeForRange,
  selectPencilType,
} from "../../features/paintingSlice";
import {
  getCalculatedCoordsOfContainCanvas,
  paintWholeCanvas,
} from "../../utils/canvas";
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
  const { color, size } = kindOfPencilStyle[pencilType];
  const { r, g, b, a } = color;
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
      paintWholeCanvas(ctx, "white", canvasSize.width, canvasSize.height);
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
      //   "El??as Yoc",
      //   canvasStyleText.positionX,
      //   canvasStyleText.positionY + canvasStyleText.canvasFontSize
      // );
      if (isDrawingToolsOpen) {
        console.log(ctx);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
      return () => {
        // ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      };
    },
    [isDrawingToolsOpen, ctx]
  );
  let { current: PressHoldTimeoutId } = useRef(null);
  let { current: moveCount } = useRef(0);

  const listenerStartPaiting = (e) => {
    if (!isDrawingToolsOpen) return;
    console.warn("starting painting");

    const xCoordMouseOrTouch = e.clientX || e.touches[0].clientX;
    const yCoordMouseOrTouch = e.clientY || e.touches[0].clientY;
    const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
      canvasElement: refCanvas.current,
      xCoord: xCoordMouseOrTouch,
      yCoord: yCoordMouseOrTouch,
      canvasWidhtPixel: canvasSize.width,
      canvasHeightPixel: canvasSize.height,
    });
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})` || "black";
    ctx.lineWidth = size || 50;
    ctx.beginPath();
    ctx.moveTo(coordX, coordY);
    ctx.lineTo(coordX, coordY);
    ctx.stroke();
    PressHoldTimeoutId = setTimeout(() => {
      paintWholeCanvas(
        ctx,
        `rgba(${r}, ${g}, ${b}, ${a})`,
        canvasSize.width,
        canvasSize.height
      );
    }, 700);
    isPainting = true;
  };
  const listenerPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    if (isPainting) {
      moveCount = moveCount + 1;
      if (PressHoldTimeoutId && moveCount > 10) {
        clearTimeout(PressHoldTimeoutId);
        PressHoldTimeoutId = null;
      }
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
    clearTimeout(PressHoldTimeoutId);
    moveCount = 0;
    isPainting = false;
  };
  console.log("render canvas");
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
