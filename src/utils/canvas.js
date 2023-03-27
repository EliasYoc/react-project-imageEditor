import { middlePointBetween } from "./helper";

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

export const redrawGlobalDrawingLogs = (
  canvasHasImage = false,
  canvasElement,
  ctx,
  refGlobalDrawingLogs
) => {
  canvasHasImage
    ? deleteCanvasWithTransparency({
        canvasCtx: ctx,
        canvasWidth: canvasElement.width,
        canvasHeight: canvasElement.height,
      })
    : paintWholeCanvas(ctx, "white", canvasElement.width, canvasElement.height);

  // para dibujar los ultimos paths y evitar lentitud (pendiente por si es necesario), aplica solo cuando pinto todo el canvas manteniendo presionado,
  // let globalDrawingLogs = refGlobalDrawingLogs.current;
  // const indexToStartDrawing = redrawGlobalDrawingLogs.current.findLastIndex(el=> el.color.a < 1 && el.whatTask === "paintingWholeCanvas" )
  for (let i = 0; i < refGlobalDrawingLogs.current.length; i++) {
    const drawingLog = refGlobalDrawingLogs.current[i];
    if (drawingLog.whatTask === "painting") {
      const path = drawingLog.data;
      if (!path.length) continue;

      const { r, g, b, a } = drawingLog.color;
      ctx.globalCompositeOperation = drawingLog.transparentEraser;

      ctx.lineWidth = drawingLog.size;
      ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${a || 0})`;
      redrawLastPath(ctx, drawingLog.data);
    }
    if (drawingLog.whatTask === "sprayPainting") {
      const { r, g, b, a } = drawingLog.color;
      const startCircleRadius = drawingLog.startCircleRadius;
      const endCircleRadius = drawingLog.endCircleRadius;
      for (const { coordX, coordY } of drawingLog.data) {
        redrawSprayPoints(
          ctx,
          coordX,
          coordY,
          startCircleRadius,
          endCircleRadius,
          drawingLog.size,
          r,
          g,
          b,
          a
        );
      }
    }
    if (drawingLog.whatTask === "paintingWholeCanvas") {
      const { r, g, b, a } = drawingLog.canvasColor;
      ctx.globalCompositeOperation = drawingLog.transparentEraser;
      drawingLog.transparentEraser === "destination-out"
        ? deleteCanvasWithTransparency({
            canvasCtx: ctx,
            canvasWidth: canvasElement.width,
            canvasHeight: canvasElement.height,
          })
        : paintWholeCanvas(
            ctx,
            `rgba(${r}, ${g}, ${b}, ${a})`,
            canvasElement.width,
            canvasElement.height
          );
    }
  }
};

export const redrawSprayPoints = (
  ctx,
  coordX,
  coordY,
  startCircleRadius,
  endCircleRadius,
  size,
  r,
  g,
  b,
  a
) => {
  const startCircleX = coordX,
    endCircleX = coordX;
  const startCircleY = coordY,
    endCircleY = coordY;
  const gradient = ctx.createRadialGradient(
    startCircleX,
    startCircleY,
    startCircleRadius,
    endCircleX,
    endCircleY,
    endCircleRadius
  );
  gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},${a})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(
    coordX - startCircleRadius,
    coordY - startCircleRadius,
    size,
    size
  );
};

export const redrawLastPath = (targetCtx, paintingLogs) => {
  if (!paintingLogs.length) return;
  let p1 = paintingLogs[0];
  let p2 = paintingLogs[1];
  // console.log(refPaintingLogs.current);
  // console.log(`p1: ${JSON.stringify(p1)},
  // p2: ${JSON.stringify(p2)}
  // `);
  targetCtx.beginPath();
  targetCtx.moveTo(p1.coordX, p1.coordY);
  targetCtx.lineTo(p1.coordX, p1.coordY);
  for (let i = 1; i < paintingLogs.length; i++) {
    const middlePoint = middlePointBetween(p1, p2);
    targetCtx.quadraticCurveTo(
      p1.coordX,
      p1.coordY,
      middlePoint.coordX,
      middlePoint.coordY
    );
    p1 = paintingLogs[i];
    p2 = paintingLogs[i + 1];
  }
  targetCtx.lineTo(p1.coordX, p1.coordY);
  targetCtx.stroke();
};
