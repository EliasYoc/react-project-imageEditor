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
  deleteCanvasWithTransparency,
  drawCanvasCoordsCallback,
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
    $canvas,
    refCanvas,
    ctx,
    canvasSize,
    principalImageLoaded,
    lowQualityDataImageLoaded,
    refGlobalDrawingLogs,
    setDrawingHistoryLength,
    drawingHistoryLength,
  } = useContext(ContextConfiguration);
  const pencilType = useSelector(selectPencilType);
  const kindOfPencilStyle = useSelector(selectKindOfPencil);
  const pencilSizeForRange = useSelector(selectPencilSizeForRange);
  const { color, size } = kindOfPencilStyle[pencilType];
  const { r, g, b, a } = color;
  const refPaintingLogs = useRef([]);
  const refWholeCanvasHasBeenPainted = useRef(false);
  let { current: pressHoldTimeoutId } = useRef(null);
  let { current: moveCount } = useRef(0);

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
      if (isDrawingToolsOpen || drawingHistoryLength === 0) {
        //config
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = "source-over";
        if (pencilType === "normal") {
        }
        if (pencilType === "chalk") {
        }
        if (pencilType === "eraser") {
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
      drawingHistoryLength,
    ]
  );

  const listenerStartPaiting = (e) => {
    if (!isDrawingToolsOpen) return;
    console.warn("starting painting");
    ctx.lineWidth = size || 50;
    ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${a || 0})`;
    ctx.beginPath();

    pressHoldTimeoutId = setTimeout(() => {
      const canvasDataForPaintingLogs = {
        canvasColor: `rgba(${r}, ${g}, ${b}, 1)`,
        whatTask: "paintingWholeCanvas",
        transparentEraser: ctx.globalCompositeOperation,
      };
      paintWholeCanvas(
        ctx,
        canvasDataForPaintingLogs.canvasColor,
        canvasSize.width,
        canvasSize.height
      );
      refGlobalDrawingLogs.current.push(canvasDataForPaintingLogs);
      refWholeCanvasHasBeenPainted.current = true;
      refPaintingLogs.current = [];
    }, 700);

    isPainting = true;
  };

  const listenerPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    if (isPainting) {
      moveCount = moveCount + 1;
      if (pressHoldTimeoutId && moveCount > 10) {
        // avoiding executing paintWholeCanvas while keeping pressed after 10 points
        clearTimeout(pressHoldTimeoutId);
        pressHoldTimeoutId = null;
      }
      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        refPaintingLogs.current.push({ coordX, coordY });
        ctx.lineTo(coordX, coordY);
        ctx.stroke();
      });
    }
  };

  const listenerStopPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    console.log("up");
    // ctx.stroke();
    clearTimeout(pressHoldTimeoutId);
    if (!refWholeCanvasHasBeenPainted.current) {
      //add one dot (works on desktop)
      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        ctx.moveTo(coordX, coordY);
        ctx.lineTo(coordX, coordY);
        ctx.stroke();
        refPaintingLogs.current.push({ coordX, coordY });
      });
    }
    if (refPaintingLogs.current.length) {
      refGlobalDrawingLogs.current.push({
        whatTask: "painting",
        data: refPaintingLogs.current,
        color: kindOfPencilStyle[pencilType].color,
        size: kindOfPencilStyle[pencilType].size,
        transparentEraser: ctx.globalCompositeOperation,
      });
    }
    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
    moveCount = 0;
    isPainting = false;
    refPaintingLogs.current = [];
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
