export const getCalculatedCoordsOfContainCanvas = ({
  canvasElement,
  canvasWidthPixel,
  canvasHeightPixel,
  xCoord,
  yCoord,
}) => {
  let realWidth = canvasElement.getBoundingClientRect().width;
  let realHeight = canvasElement.getBoundingClientRect().height;
  let dominantCellSize;
  // canvasWidhtPixel > canvasHeightPixel
  //   ? realWidth / canvasWidhtPixel
  //   : realHeight / canvasHeightPixel;
  if (canvasWidthPixel > canvasHeightPixel) {
    dominantCellSize = realWidth / canvasWidthPixel;
    console.log("rectangulo horizontal");
  }
  if (canvasWidthPixel < canvasHeightPixel) {
    console.log("rectangulo vertical");
    dominantCellSize = realHeight / canvasHeightPixel;
  }
  if (canvasWidthPixel === canvasHeightPixel) {
    console.log("cuadrado");
    dominantCellSize =
      realWidth > realHeight
        ? realHeight / canvasHeightPixel
        : realWidth / canvasWidthPixel;
  }
  console.log(dominantCellSize);
  let coordX = Math.floor(
    (xCoord -
      canvasElement.offsetLeft -
      (realWidth - dominantCellSize * canvasWidthPixel) / 2) /
      dominantCellSize
  );
  let coordY = Math.floor(
    (yCoord -
      canvasElement.offsetTop -
      (realHeight - dominantCellSize * canvasHeightPixel) / 2) /
      dominantCellSize
  );
  console.log(coordX, coordY);
  return { coordX, coordY };
};
export const deleteCanvas = ({ currentCtx, canvasSize }) => {
  currentCtx.fillStyle = "white";
  currentCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);
};
export const paintWholeCanvas = (
  ctx,
  color = "white",
  canvasWidth,
  canvasHeight
) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
};
