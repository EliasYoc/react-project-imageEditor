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

export const deleteCanvasWithTransparency = ({
  canvasCtx,
  canvasWidth,
  canvasHeight,
}) => {
  canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
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

export const drawCanvasCoordsCallback = (
  mouseTouchEvent,
  canvasElement,
  callback
) => {
  const xCoordMouseOrTouch = isNaN(mouseTouchEvent.clientX)
    ? mouseTouchEvent.changedTouches[0].clientX
    : mouseTouchEvent.clientX;
  const yCoordMouseOrTouch = isNaN(mouseTouchEvent.clientY)
    ? mouseTouchEvent.changedTouches[0].clientY
    : mouseTouchEvent.clientY;
  const { coordX, coordY } = getCalculatedCoordsOfContainCanvas({
    canvasElement: canvasElement,
    xCoord: xCoordMouseOrTouch,
    yCoord: yCoordMouseOrTouch,
    canvasWidthPixel: canvasElement.width,
    canvasHeightPixel: canvasElement.height,
  });
  callback(coordX, coordY);
};
