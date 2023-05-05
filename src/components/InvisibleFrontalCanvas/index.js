import React, { useEffect, useRef, useState } from "react";
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
  redrawLastPath,
  redrawSprayPoints,
} from "../../utils/canvas";
import ElementEditable from "../Text/ElementEditable";
import PortalNormalModal from "../Layout/PortalNormalModal";
import { debounce } from "../../utils/helper";

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

  const [checkInput, setCheckInput] = useState(false);
  const $frontalCanvas = refFrontalCanvas.current;
  const frontalCanvasCtx = $frontalCanvas?.getContext("2d");
  const { color, size } = kindOfPencilStyle[pencilType];

  const { r, g, b, a: alpha } = color;
  const refPaintingLogs = useRef([]);
  const refWholeCanvasHasBeenPainted = useRef(false);
  let { current: pressHoldTimeoutId } = useRef(null);
  let { current: pointCounter } = useRef(0);
  const refGradientCircleRadius = useRef(0);
  const refPercentageOffForSecondCircle = useRef(89 / 100);
  const refSecondCircleRadius = useRef();
  let { current: allowOneDotAfterPaintingWholeCanvas } = useRef(false);
  const refContainer = useRef();

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
      if (isDrawingToolsOpen || drawingHistoryLength === 0) {
        //config
        ctx.lineCap = frontalCanvasCtx.lineCap = "round";
        ctx.lineJoin = frontalCanvasCtx.lineJoin = "round";
        ctx.globalCompositeOperation =
          frontalCanvasCtx.globalCompositeOperation = "source-over";

        if (pencilType === "normal") {
        }
        if (pencilType === "chalk") {
        }
        if (pencilType === "spray") {
          refGradientCircleRadius.current = size / 2;
          let resultRadiusRest =
            refGradientCircleRadius.current *
            refPercentageOffForSecondCircle.current;
          refSecondCircleRadius.current =
            refGradientCircleRadius.current - resultRadiusRest;
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
    ctx.lineWidth = frontalCanvasCtx.lineWidth = size || 50;
    ctx.strokeStyle =
      frontalCanvasCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    frontalCanvasCtx.beginPath();
    ctx.beginPath();

    pressHoldTimeoutId = setTimeout(() => {
      const canvasDataForPaintingLogs = {
        canvasColor: { r, g, b, a: alpha },
        whatTask: "paintingWholeCanvas",
        globalCompositeOperation: frontalCanvasCtx.globalCompositeOperation,
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
      allowOneDotAfterPaintingWholeCanvas = false;
    }, 500);

    isPainting = true;
    allowOneDotAfterPaintingWholeCanvas = true;
  };

  const listenerPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    if (isPainting) {
      pointCounter = pointCounter + 1;
      if (pressHoldTimeoutId && pointCounter > 8) {
        // smarthphone avoiding executing paintWholeCanvas while keeping pressed after 10 points
        clearTimeout(pressHoldTimeoutId);
        pressHoldTimeoutId = null;
      }
      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        refPaintingLogs.current.push({ coordX, coordY });
        if (pencilType === "eraser") {
          ctx.lineTo(coordX, coordY);
          ctx.stroke();
          return;
        }
        if (pencilType === "spray") {
          redrawSprayPoints(
            ctx,
            coordX,
            coordY,
            refGradientCircleRadius.current,
            refSecondCircleRadius.current,
            size,
            r,
            g,
            b,
            alpha
          );
          return;
        }
        if (!allowOneDotAfterPaintingWholeCanvas) {
          deleteCanvasWithTransparency({
            canvasCtx: frontalCanvasCtx,
            canvasHeight: canvasSize.height,
            canvasWidth: canvasSize.width,
          });
          redrawLastPath(frontalCanvasCtx, refPaintingLogs.current);
        }
      });
    }
    if (allowOneDotAfterPaintingWholeCanvas)
      allowOneDotAfterPaintingWholeCanvas = false;
  };

  const listenerStopPainting = (e) => {
    if (!isDrawingToolsOpen) return;
    clearTimeout(pressHoldTimeoutId);
    if (!refWholeCanvasHasBeenPainted.current) {
      drawCanvasCoordsCallback(e, $canvas, (coordX, coordY) => {
        if (pencilType === "spray") {
          redrawSprayPoints(
            ctx,
            coordX,
            coordY,
            refGradientCircleRadius.current,
            refSecondCircleRadius.current,
            size,
            r,
            g,
            b,
            alpha
          );
          refPaintingLogs.current.push({ coordX, coordY });
        }
        if (pencilType === "normal" && allowOneDotAfterPaintingWholeCanvas) {
          // alert(refWholeCanvasHasBeenPainted.current);

          ctx.lineTo(coordX, coordY);
          ctx.stroke();
          refPaintingLogs.current.push({ coordX, coordY });
        }
        if (pencilType === "eraser") {
          ctx.lineTo(coordX, coordY);
          ctx.stroke();
          refPaintingLogs.current.push({ coordX, coordY });
        }
      });
    }

    if (refPaintingLogs.current.length) {
      const defaultGlobalLogProperties = {
        data: refPaintingLogs.current,
        color: kindOfPencilStyle[pencilType].color,
        size: kindOfPencilStyle[pencilType].size,
        globalCompositeOperation: frontalCanvasCtx.globalCompositeOperation,
      };
      if (pencilType === "spray") {
        refGlobalDrawingLogs.current.push({
          ...defaultGlobalLogProperties,
          whatTask: "sprayPainting",
          startCircleRadius: refGradientCircleRadius.current,
          endCircleRadius: refSecondCircleRadius.current,
        });
      } else {
        refGlobalDrawingLogs.current.push({
          ...defaultGlobalLogProperties,
          whatTask: "painting",
        });
        deleteCanvasWithTransparency({
          canvasCtx: frontalCanvasCtx,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        });
        redrawLastPath(ctx, refPaintingLogs.current);
      }
    }

    console.log(refPaintingLogs.current);
    console.log(refGlobalDrawingLogs.current);

    setDrawingHistoryLength(refGlobalDrawingLogs.current.length);
    pointCounter = 0;
    isPainting = false;
    refPaintingLogs.current = [];
    refWholeCanvasHasBeenPainted.current = false;
    allowOneDotAfterPaintingWholeCanvas = false;
  };

  console.log("frontal canvas");

  const updateDraggingLog = debounce((e) => {
    console.log("debouncelog", e);
    const modifiedGlobalLogs = refGlobalDrawingLogs.current.map((moveable) => {
      if (moveable.id === e.target.id) {
        return {
          ...moveable,
          translate: e.translate || moveable.translate,
          scale: e.scale || moveable.scale,
          offsetLeft: e.target.offsetLeft,
          offsetTop: e.target.offsetTop,
          realWidth: e.moveable.state.pos4[0],
          realHeight: e.moveable.state.pos4[1],
          realTop: e.moveable.state.moveableClientRect.top,
          realLeft: e.moveable.state.moveableClientRect.left,
        };
      } else {
        return moveable;
      }
    });
    refGlobalDrawingLogs.current = modifiedGlobalLogs;
    console.log(refGlobalDrawingLogs);
  }, 300);

  return (
    <div
      className="scrollable"
      ref={refContainer}
      style={{
        width: "100%",
        height: `calc(100% - ${headerHeight + footerHeight}px)`,
        background: "#ff00005c",
        position: "absolute",
        marginTop: `${headerHeight}px`,
        overflow: "hidden",
        left: 0,
      }}
    >
      <PortalNormalModal
        isOpen={checkInput}
        onClose={() => setCheckInput(false)}
      />
      {refGlobalDrawingLogs.current
        .filter(
          (log) =>
            log.whatTask === "draggableText" ||
            log.whatTask === "draggableSticker"
        )
        .map((draggable) => {
          if (draggable.whatTask === "draggableText")
            return (
              <ElementEditable
                key={draggable.id}
                parentNode={refContainer.current}
                setCheckInput={setCheckInput}
                // checkInput={checkInput}
                id={draggable.id}
                onRender={(e) => {
                  // updateLog(e);
                  console.log("render");
                  e.target.style.cssText += e.cssText;
                  refContainer.current.scrollTo(0, 0);
                }}
                onScale={updateDraggingLog}
                onDrag={updateDraggingLog}
                refGlobalDrawingLogs={refGlobalDrawingLogs}
              />
            );
          return draggable;
        })}

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
          position: "absolute",
          zIndex: "1",
          background: "rgba(90,255,78,.3)",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          imageRendering: "crisp-edges",
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
    </div>
  );
};

export default InvisibleFrontalCanvas;
