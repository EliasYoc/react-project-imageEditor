import { useContext, useEffect, useRef } from "react";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import { getCalculatedCoordsOfContainCanvas } from "../../utils/canvas";
// const paintPixelByPixelCanvasExample = (canvasSize, ctx) => {
//   for (var x = 0; x < canvasSize.width; x++) {
//     for (var y = 0; y < canvasSize.height; y++) {
//       ctx.fillStyle = "#" + Math.floor(Math.random() * 16777215).toString(16); // pick random color
//       ctx.fillRect(x, y, 1, 1); // draw pixel on canvas
//     }
//   }
// };
const canvasSize = {
  width: 1080,
  height: 1920,
};
const Canvas = () => {
  const refCanvas = useRef();
  const { fullHeightSumForCanvas } = useContext(ContextToolBoxes);
  const { isDrawingToolsOpen } = useContext(ContextConfiguration);
  useEffect(
    function painting() {
      // const canvasStyleText = {
      //   canvasFontSize: 240,
      //   positionX: 0,
      //   positionY: 0,
      // };

      refCanvas.current.width = canvasSize.width;
      refCanvas.current.height = canvasSize.height;
      const ctx = refCanvas.current.getContext("2d");
      //painting canvas
      ctx.fillStyle = "gray";
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.strokeStyle = "rgba(211, 13, 13, 0.10)";

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
      const $canvas = refCanvas.current;
      let isPainting = false;

      const listenerStartPaiting = (e) => {
        console.warn("starting painting");
        ctx.beginPath();
        const xCoordMouseOrTouch = e.x || e.touches[0].clientX;
        const yCoordMouseOrTouch = e.y || e.touches[0].clientY;

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
        if (isPainting) {
          console.log("mouse or touch");
          const xCoordMouseOrTouch = e.x || e.touches[0].clientX;
          const yCoordMouseOrTouch = e.y || e.touches[0].clientY;
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
        console.log("up");
        // ctx.stroke();

        isPainting = false;
      };
      if (isDrawingToolsOpen) {
        console.log(ctx);
        ctx.lineWidth = 100;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        $canvas.addEventListener("mousedown", listenerStartPaiting);
        $canvas.addEventListener("touchstart", listenerStartPaiting);
        $canvas.addEventListener("mousemove", listenerPainting);
        $canvas.addEventListener("touchmove", listenerPainting);
        $canvas.addEventListener("touchend", listenerStopPainting);
        $canvas.addEventListener("mouseup", listenerStopPainting);
      }
      return () => {
        $canvas.removeEventListener("mousedown", listenerStartPaiting);
        $canvas.removeEventListener("touchstart", listenerStartPaiting);
        $canvas.removeEventListener("mousemove", listenerStartPaiting);
        $canvas.removeEventListener("touchmove", listenerStartPaiting);
        $canvas.removeEventListener("touchend", listenerStopPainting);
        $canvas.removeEventListener("mouseup", listenerStopPainting);
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      };
    },
    [isDrawingToolsOpen]
  );
  //restar el height con calc()
  return (
    <canvas
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
      width={100}
      height={100}
    >
      canvas editor
    </canvas>
  );
};

export default Canvas;
