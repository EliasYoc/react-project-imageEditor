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

const Canvas = () => {
  const { fullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const {
    isDrawingToolsOpen,
    refCanvas,
    ctx,
    canvasSize,
    principalImageLoaded,
    lowQualityDataImageLoaded,
    refGlobalDrawingLogs,
  } = useContext(ContextConfiguration);
  const pencilType = useSelector(selectPencilType);
  const kindOfPencilStyle = useSelector(selectKindOfPencil);
  const pencilSizeForRange = useSelector(selectPencilSizeForRange);
  const { color, size } = kindOfPencilStyle[pencilType];
  const { r, g, b, a } = color;
  const refPaintingLogs = useRef([]);
  let isPainting = false;
  useEffect(
    function init() {
      if (!ctx) return;
      if (lowQualityDataImageLoaded) {
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        return;
      }
      paintWholeCanvas(ctx, "white", canvasSize.width, canvasSize.height);
      return () => {};
    },
    [ctx, canvasSize, lowQualityDataImageLoaded]
  );

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
        ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${a || 0})`;
        ctx.lineWidth = size || 50;
        ctx.globalCompositeOperation = "source-over";
        console.warn(pencilType);
        if (pencilType === "normal") {
        }
        if (pencilType === "chalk") {
        }
        if (pencilType === "eraser") {
          console.warn(ctx.globalCompositeOperation);
          if (principalImageLoaded)
            ctx.globalCompositeOperation = "destination-out";
        }
      }
      return () => {
        // ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      };
    },
    [
      isDrawingToolsOpen,
      ctx,
      pencilType,
      r,
      g,
      b,
      a,
      size,
      principalImageLoaded,
    ]
  );
  let { current: PressHoldTimeoutId } = useRef(null);
  let { current: moveCount } = useRef(0);

  const listenerStartPaiting = (e) => {
    if (!isDrawingToolsOpen) return;
    console.warn("starting painting");
    const xCoordMouseOrTouch = isNaN(e.clientX)
      ? e.touches[0].clientX
      : e.clientX;
    const yCoordMouseOrTouch = isNaN(e.clientY)
      ? e.touches[0].clientY
      : e.clientY;
    const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
      canvasElement: refCanvas.current,
      xCoord: xCoordMouseOrTouch,
      yCoord: yCoordMouseOrTouch,
      canvasWidthPixel: canvasSize.width,
      canvasHeightPixel: canvasSize.height,
    });
    ctx.beginPath();
    ctx.moveTo(coordX, coordY);
    ctx.lineTo(coordX, coordY);
    ctx.stroke();
    refPaintingLogs.current.push({ coordX, coordY });
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
      const xCoordMouseOrTouch = isNaN(e.clientX)
        ? e.touches[0].clientX
        : e.clientX;
      const yCoordMouseOrTouch = isNaN(e.clientY)
        ? e.touches[0].clientY
        : e.clientY;
      const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
        canvasElement: refCanvas.current,
        xCoord: xCoordMouseOrTouch,
        yCoord: yCoordMouseOrTouch,
        canvasWidthPixel: canvasSize.width,
        canvasHeightPixel: canvasSize.height,
      });
      refPaintingLogs.current.push({ coordX, coordY });
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
    refGlobalDrawingLogs.current.push({
      whatTask: "painting",
      data: refPaintingLogs.current,
      color: kindOfPencilStyle[pencilType].color,
      size: kindOfPencilStyle[pencilType].size,
      transparentEraser: ctx.globalCompositeOperation,
    });
    refPaintingLogs.current = [];
    console.log(refGlobalDrawingLogs.current);
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
          backgroundImage: `url(${lowQualityDataImageLoaded})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center",
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
