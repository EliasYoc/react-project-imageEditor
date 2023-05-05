import React, { useEffect, useRef } from "react";
import Moveable from "react-moveable";
import { debounce } from "../../utils/helper";

const ElementEditable = ({
  parentNode,
  setCheckInput,
  onRender,
  id,
  checkInput,
  onScale,
  onDrag,
  refGlobalDrawingLogs,
}) => {
  const refMoveable = useRef();
  useEffect(
    function initialUpdateOfDraggableElement() {
      // puede que este forEach lo tenga que poner al descargar
      refGlobalDrawingLogs.current.forEach((log) => {
        if (log.whatTask === "draggableText" && log.id === id) {
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
        }
      });
      return () => {};
    },
    [id, refGlobalDrawingLogs]
  );
  const resetPosition = () => parentNode.scrollTo({ left: 0, top: 0 });

  const updateMoveableBlueArea = () => {
    refMoveable.current.updateRect();
    updateGlobalLogsElementSize();
    resetPosition();
  };

  const updateGlobalLogsElementSize = debounce(() => {
    refGlobalDrawingLogs.current.forEach((log) => {
      if (log.whatTask === "draggableText" && log.id === id) {
        const draggableElement = document.getElementById(log.id);
        const { width, height } = getComputedStyle(draggableElement);
        const floatWidth = parseFloat(width.slice(0, -2));
        const floatHeight = parseFloat(height.slice(0, -2));
        log.realWidth = floatWidth;
        log.realHeight = floatHeight;
      }
    });
  }, 300);
  return (
    <>
      <div
        id={id}
        contentEditable
        onKeyDown={updateMoveableBlueArea}
        onBlur={() => {
          resetPosition();
          setCheckInput(false);
        }}
        onTouchMove={(e) => {
          e.target.blur();
          setCheckInput(false);
        }}
        className={`target${id}`}
        style={{
          left: "50%",
          borderRadius: "1rem",
          top: "20px",
          minWidth: "40.5px",
          padding: ".5rem",
          background: "orange",
          position: "absolute",
          color: "black",
          zIndex: "15",
          wordBreak: "break-all",
          fontSize: "1.4rem",
        }}
      />
      <Moveable
        ref={refMoveable}
        checkInput={checkInput}
        target={`.target${id}`}
        scalable
        draggable
        // snappable
        rotatable
        keepRatio
        renderDirections={["w", "e", "s", "n"]}
        pinchable
        // onScale={(e) => {
        //   e.target.style.transform = e.drag.transform;
        // }}
        onDrag={onDrag}
        onScale={onScale}
        onRender={onRender}
        onClick={(e) => {
          if (e.isDouble && e.inputTarget.contentEditable === "true") {
            e.inputTarget.focus();
            setCheckInput(true);
          }
        }}
        // onDrag={(e) => (e.target.style.transform = e.transform)}
        // bounds={{ top: 0, left: 0, right: 0, bottom: 0, position: "css" }}
      />
    </>
  );
};

export default ElementEditable;
