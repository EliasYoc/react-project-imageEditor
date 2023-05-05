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
      ctx.globalCompositeOperation = drawingLog.globalCompositeOperation;
      ctx.lineWidth = drawingLog.size;
      ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${a || 0})`;

      redrawLastPath(ctx, drawingLog.data);
    }
    if (drawingLog.whatTask === "sprayPainting") {
      const { r, g, b, a } = drawingLog.color;
      const startCircleRadius = drawingLog.startCircleRadius;
      const endCircleRadius = drawingLog.endCircleRadius;
      ctx.globalCompositeOperation = drawingLog.globalCompositeOperation;

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
      ctx.globalCompositeOperation = drawingLog.globalCompositeOperation;
      drawingLog.globalCompositeOperation === "destination-out"
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

export function bestFitGradient({ angle, colorList = [], w, h, ctx }) {
  var dist = Math.sqrt(w * w + h * h) / 2; // get the diagonal length

  const shortestLength = h < w ? h : w;
  var diagAngle = Math.asin(shortestLength / 2 / dist); // get the diagonal angle

  // Do the symmetry on the angle (move to first quad
  var a1 = ((angle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2);
  if (a1 > Math.PI) {
    a1 -= Math.PI;
  }
  if (a1 > Math.PI / 2 && a1 <= Math.PI) {
    a1 = Math.PI / 2 - (a1 - Math.PI / 2);
  }
  // get angles from center to edges for along and right of gradient
  var ang1 = Math.PI / 2 - diagAngle - Math.abs(a1);
  var ang2 = Math.abs(diagAngle - Math.abs(a1));

  // get distance from center to horizontal and vertical edges
  var dist1 = Math.cos(ang1) * h;
  var dist2 = Math.cos(ang2) * w;

  // get the max distance
  var scale = Math.max(dist2, dist1) / 1.7;

  // get the vector to the start and end of gradient
  var dx = Math.cos(angle) * scale;
  var dy = Math.sin(angle) * scale;

  // create the gradient
  const gradient = ctx.createLinearGradient(
    w / 2 + dx, // start pos
    h / 2 + dy,
    w / 2 - dx, // end pos
    h / 2 - dy
  );
  // add colours

  colorList.forEach(
    (color, i) =>
      color && gradient.addColorStop(color.opacity, color.backgroundString)
  );

  return gradient;
}

export const transformElementSizeIntoCanvasElementSize = (
  elementWidth = 0,
  elementHeight = 0,
  canvasStyleWidth = 0,
  canvasStyleHeigth = 0,
  canvasWidth = 0,
  canvasHeight = 0
) => {
  let newElementWidth;
  let newElementHeight;
  if (canvasWidth > canvasHeight) {
    newElementWidth = (elementWidth * canvasWidth) / canvasStyleWidth;
    newElementHeight = (elementHeight * canvasWidth) / canvasStyleWidth;
  } else {
    newElementWidth = (elementWidth * canvasHeight) / canvasStyleHeigth;
    newElementHeight = (elementHeight * canvasHeight) / canvasStyleHeigth;
  }
  return { newElementWidth, newElementHeight };
};
