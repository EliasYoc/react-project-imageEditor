import { useContext, useEffect } from "react";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import { paintWholeCanvas } from "../../utils/canvas";
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
  const { refCanvas, ctx, canvasSize, lowQualityDataImageLoaded } =
    useContext(ContextConfiguration);

  useEffect(
    function init() {
      if (!ctx) return;
      if (lowQualityDataImageLoaded) {
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        return;
      }
      paintWholeCanvas(ctx, "white", canvasSize.width, canvasSize.height);
    },
    [ctx, canvasSize, lowQualityDataImageLoaded]
  );

  console.log("render canvas");
  return (
    <canvas
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
  );
};

export default Canvas;
