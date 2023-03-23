import React, { useEffect, useRef } from "react";
import { useContext } from "react";
import { useSelector } from "react-redux";
import PixelRange from "../PixelRange/PixelRange";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
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

const InvisibleFrontalCanvas = ({ headerSize, footerSize }) => {
  const {
    refFrontalCanvas,
    canvasSize,
    lowQualityDataImageLoaded,
    refGlobalDrawingLogs,
    setDrawingHistoryLength,
    drawingHistoryLength,
    $canvas,
    principalImageLoaded,
    isDrawingToolsOpen,
    ctx,
  } = useContext(ContextConfiguration);
  const pencilType = useSelector(selectPencilType);
  const kindOfPencilStyle = useSelector(selectKindOfPencil);
  const pencilSizeForRange = useSelector(selectPencilSizeForRange);

  const $frontalCanvas = refFrontalCanvas.current;
  const frontalCanvasCtx = $frontalCanvas?.getContext("2d");
  const { color, size } = kindOfPencilStyle[pencilType];

  const { r, g, b, a: alpha } = color;
  const refPaintingLogs = useRef([]);
  const refWholeCanvasHasBeenPainted = useRef(false);
  let { current: pressHoldTimeoutId } = useRef(null);
  let { current: pointCounter } = useRef(0);
  const refAllowOneDot = useRef(false);

  let isPainting = false;
  useEffect(
    function init() {
      if (!frontalCanvasCtx) return;
      if (lowQualityDataImageLoaded) {
        frontalCanvasCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        return;
      }
      paintWholeCanvas(
        frontalCanvasCtx,
        "rgba(255,255,23,0)",
        canvasSize.width,
        canvasSize.height
      );
      return () => {};
    },
    [frontalCanvasCtx, canvasSize, lowQualityDataImageLoaded]
  );

  const stringPxToNumber = (text) => parseFloat(text.split("px").join(""));
  const headerHeight = stringPxToNumber(headerSize.height);
  const footerHeight = stringPxToNumber(footerSize.height);
  useEffect(
    function painting() {
      if (!frontalCanvasCtx) return;

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
        ctx.lineCap = frontalCanvasCtx.lineCap = "round";
        ctx.lineJoin = frontalCanvasCtx.lineJoin = "round";
        ctx.globalCompositeOperation =
          frontalCanvasCtx.globalCompositeOperation = "source-over";
        ctx.filter = frontalCanvasCtx.filter = "none";

        if (pencilType === "normal") {
        }
        if (pencilType === "chalk") {
        }
        if (pencilType === "spray") {
          ctx.filter = frontalCanvasCtx.filter = "blur(15px)";
        }
        if (pencilType === "eraser") {
          if (principalImageLoaded)
            ctx.globalCompositeOperation =
              frontalCanvasCtx.globalCompositeOperation = "destination-out";
        }
      }
      return () => {
        // ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      };
    },
    [
      ctx,
      isDrawingToolsOpen,
      frontalCanvasCtx,
      pencilType,
      r,
      g,
      b,
      alpha,
      size,
      principalImageLoaded,
      drawingHistoryLength,
    ]
  );
  const listenerStartPaiting = (e) => {
    if (!isDrawingToolsOpen) return;
    console.warn("starting painting");
    ctx.lineWidth = frontalCanvasCtx.lineWidth = size || 50;
    ctx.strokeStyle =
      frontalCanvasCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    frontalCanvasCtx.beginPath();
    ctx.beginPath();

    pressHoldTimeoutId = setTimeout(() => {
      const canvasDataForPaintingLogs = {
        canvasColor: { r, g, b, a: alpha },
        whatTask: "paintingWholeCanvas",
        transparentEraser: frontalCanvasCtx.globalCompositeOperation,
      };
      paintWholeCanvas(
        ctx,
        `rgba(${r}, ${g}, ${b}, ${alpha})`,
        canvasSize.width,
        canvasSize.height
      );
      refGlobalDrawingLogs.current.push(canvasDataForPaintingLogs);
      refWholeCanvasHasBeenPainted.current = true;
      refPaintingLogs.current = [];
      refAllowOneDot.current = false;
    }, 700);

    isPainting = true;
    refAllowOneDot.current = true;
  };

  const listenerPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    if (isPainting) {
      pointCounter = pointCounter + 1;
      if (pressHoldTimeoutId && pointCounter > 10) {
        // avoiding executing paintWholeCanvas while keeping pressed after 10 points
        clearTimeout(pressHoldTimeoutId);
        pressHoldTimeoutId = null;
      }
      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        refPaintingLogs.current.push({ coordX, coordY });
        if (alpha < 1 || pencilType === "spray") {
          console.log("not opacity");
          deleteCanvasWithTransparency({
            canvasCtx: frontalCanvasCtx,
            canvasHeight: canvasSize.height,
            canvasWidth: canvasSize.width,
          });
          redrawLastPath(frontalCanvasCtx);
        } else {
          ctx.lineTo(coordX, coordY);
          ctx.stroke();
        }
      });
    }
    if (refAllowOneDot.current) refAllowOneDot.current = false;
  };

  const listenerStopPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    console.log("up");
    clearTimeout(pressHoldTimeoutId);
    if (!refWholeCanvasHasBeenPainted.current) {
      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        ctx.moveTo(coordX, coordY);
        ctx.lineTo(coordX, coordY);
        if (refAllowOneDot.current) ctx.stroke();
        refPaintingLogs.current.push({ coordX, coordY });
      });
    }

    refGlobalDrawingLogs.current.push({
      whatTask: "painting",
      data: refPaintingLogs.current,
      color: kindOfPencilStyle[pencilType].color,
      size: kindOfPencilStyle[pencilType].size,
      transparentEraser: frontalCanvasCtx.globalCompositeOperation,
      filter: frontalCanvasCtx.filter,
    });
    if (alpha < 1 || pencilType === "spray") {
      deleteCanvasWithTransparency({
        canvasCtx: frontalCanvasCtx,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      });
      redrawLastPath(ctx);
    }
    console.log(refPaintingLogs.current);
    console.log(refGlobalDrawingLogs.current);

    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
    pointCounter = 0;
    isPainting = false;
    refPaintingLogs.current = [];
    refWholeCanvasHasBeenPainted.current = false;
    refAllowOneDot.current = false;
  };

  //good for redrawing semi transparent path
  const redrawLastPath = (targetCtx) => {
    if (!refPaintingLogs.current.length) return;
    const { coordX: x, coordY: y } = refPaintingLogs.current[0];
    targetCtx.beginPath();
    targetCtx.moveTo(x, y);
    for (let i = 1; i < refPaintingLogs.current.length; i++) {
      const { coordX, coordY } = refPaintingLogs.current[i];
      targetCtx.lineTo(coordX, coordY);
    }
    targetCtx.stroke();
  };
  console.log("frontal canvas");
  return (
    <>
      <canvas
        onMouseDown={listenerStartPaiting}
        onTouchStart={listenerStartPaiting}
        onMouseMove={listenerPainting}
        onTouchMove={listenerPainting}
        onMouseUp={listenerStopPainting}
        onTouchEnd={listenerStopPainting}
        width={canvasSize.width}
        height={canvasSize.height}
        ref={refFrontalCanvas}
        style={{
          width: "100%",
          marginTop: `${headerHeight}px`,
          height: `calc(100% - ${headerHeight + footerHeight}px)`,
          position: "absolute",
          objectFit: "contain",
        }}
      >
        Este navegador no es compatible
      </canvas>
      {isDrawingToolsOpen && (
        <PixelRange
          pixelSize={pencilSizeForRange}
          minValue={15}
          maxValue={200}
        />
      )}
    </>
  );
};

export default InvisibleFrontalCanvas;
