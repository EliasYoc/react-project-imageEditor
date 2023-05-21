export const updateInitialDraggableTextElementSize = (
  refGlobalDrawingLogs,
  draggableTextId
) => {
  refGlobalDrawingLogs.current.forEach((log) => {
    if (log.whatTask === "draggableText" && log.id === draggableTextId) {
      const draggableElement = document.getElementById(log.id);
      const { left, top } = draggableElement.getBoundingClientRect();
      const { width, height } = getComputedStyle(draggableElement);
      const floatWidth = parseFloat(width.slice(0, -2));
      const floatHeight = parseFloat(height.slice(0, -2));
      log.left = log.realLeft = left;
      log.top = log.realTop = top;
      log.offsetLeft = draggableElement.offsetLeft;
      log.offsetTop = draggableElement.offsetTop;
      log.initialWidth = log.realWidth = floatWidth;
      log.initialHeight = log.realHeight = floatHeight;
      // log.initialWidth = log.realWidth = log.realWidth || floatWidth;
      // log.initialHeight = log.realHeight = log.realHeight || floatHeight;
      console.dir(draggableElement);
      console.log("update draggableSize", log);
    }
  });
};

export const updateDraggableRect = (
  refGlobalDrawingLogs,
  moveable,
  draggableElementId
) => {
  if (!moveable.state.target) return null;
  return refGlobalDrawingLogs.current.map((draggable) => {
    if (draggable.id === draggableElementId) {
      console.log(moveable);
      console.log(
        moveable.state.targetClientRect.width,
        moveable.state.targetClientRect.height
      );
      return {
        ...draggable,
        translate:
          [moveable.state.targetMatrix[12], moveable.state.targetMatrix[13]] ||
          draggable.translate,
        scale:
          [moveable.state.targetMatrix[0], moveable.state.targetMatrix[5]] ||
          draggable.scale,
        offsetLeft: moveable.state.target.offsetLeft,
        offsetTop: moveable.state.target.offsetTop,
        realWidth: moveable.state.targetClientRect.width,
        realHeight: moveable.state.targetClientRect.height,
        realTop: moveable.state.targetClientRect.top,
        realLeft: moveable.state.targetClientRect.left,
      };
    } else {
      return draggable;
    }
  });
};
