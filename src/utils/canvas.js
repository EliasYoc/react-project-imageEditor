export const getCalculatedCoordsOfContainCanvas = ({
  canvasElement,
  canvasWidthPixel,
  canvasHeightPixel,
  xCoord,
  yCoord,
}) => {
  let originalCanvasWidth = canvasElement.getBoundingClientRect().width;
  let originalCanvasHeight = canvasElement.getBoundingClientRect().height;
  let dominantCellSize;
  //when resizing the viewport the least possible, to resize the contain canvas there will be troubles for painting
  // canvas container horizontal
  const cellSize = originalCanvasHeight / canvasHeightPixel; //calculating pixel size
  const maxWidth = cellSize * canvasWidthPixel;
  // const maxHeight = cellSize * canvasHeightPixel;
  if (canvasWidthPixel > canvasHeightPixel) {
    console.log("canvas horizontal");
    console.log(originalCanvasWidth, originalCanvasHeight);
    dominantCellSize =
      originalCanvasWidth < maxWidth
        ? originalCanvasWidth / canvasWidthPixel ////calculating pixel size
        : cellSize;

    // const calculatedContainBgHeight =
    //   originalCanvasWidth < maxWidth
    //     ? dominantCellSize * canvasHeightPixel
    //     : maxHeight;
    // const calculatedContainCanvasWidth =
    //   originalCanvasWidth < maxWidth
    //     ? dominantCellSize * canvasWidthPixel
    //     : maxWidth;
  } else {
    //canvas container vertical
    console.log("canvas vertical");
    dominantCellSize =
      originalCanvasWidth < maxWidth
        ? originalCanvasWidth / canvasWidthPixel ////calculating pixel size
        : cellSize;
  }
  // investigar este calculo
  let coordX = Math.floor(
    (xCoord -
      canvasElement.offsetLeft -
      (originalCanvasWidth - dominantCellSize * canvasWidthPixel) / 2) /
      dominantCellSize
  );
  let coordY = Math.floor(
    (yCoord -
      canvasElement.offsetTop -
      (originalCanvasHeight - dominantCellSize * canvasHeightPixel) / 2) /
      dominantCellSize
  );
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
