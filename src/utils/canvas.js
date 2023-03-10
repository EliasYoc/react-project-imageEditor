export const getCalculatedCoordsOfContainCanvas = ({
  canvasElement,
  canvasWidhtPixel,
  canvasHeightPixel,
  xCoord,
  yCoord,
}) => {
  let realWidth = canvasElement.getBoundingClientRect().width;
  let realHeight = canvasElement.getBoundingClientRect().height;
  let dominantCellSize =
    canvasWidhtPixel > canvasHeightPixel
      ? realWidth / canvasWidhtPixel
      : realHeight / canvasHeightPixel;

  let coordX = Math.floor(
    (xCoord -
      canvasElement.offsetLeft -
      (realWidth - dominantCellSize * canvasWidhtPixel) / 2) /
      dominantCellSize
  );
  let coordY = Math.floor(
    (yCoord -
      canvasElement.offsetTop -
      (realHeight - dominantCellSize * canvasHeightPixel) / 2) /
      dominantCellSize
  );
  return { coordX, coordY };
};
export const deleteCanvas = ({ currentCtx, canvasSize }) => {
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
