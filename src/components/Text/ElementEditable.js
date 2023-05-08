import React, { useEffect, useRef } from "react";
import Moveable from "react-moveable";
import { useDispatch } from "react-redux";
import { applyDraggableTextId } from "../../features/paintingSlice";
import { debounce } from "../../utils/helper";

const ElementEditable = ({
  parentNode,
  setCheckInput,
  onRender,
  onRotate,
  id,
  checkInput,
  onScale,
  onDrag,
  refGlobalDrawingLogs,
}) => {
  const refMoveable = useRef();
  const refEditableElement = useRef();
  const dispatch = useDispatch();
  useEffect(
    function initialUpdateOfDraggableElement() {
      // puede que este forEach lo tenga que poner al descargar
      console.log("Element EDITABLE", id);
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
      refEditableElement.current.focus();
      setCheckInput(true);
      dispatch(applyDraggableTextId(id));
      return () => {
        dispatch(applyDraggableTextId(null));
      };
    },
    [id, refGlobalDrawingLogs, setCheckInput, dispatch]
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
        className={`target${id}`}
        onClick={() => dispatch(applyDraggableTextId(id))}
        style={{
          maxWidth: "315px",
          left: "50%",
          top: "20px",
          // minWidth: "40.5px",
          position: "absolute",
          color: "rgba(0,0,0,1)",
          zIndex: "15",
          wordBreak: "break-word",
          fontSize: "1.4rem",
          padding: ".5rem 0",
          // background: "pink",
        }}
      >
        <span
          ref={refEditableElement}
          onKeyDown={updateMoveableBlueArea}
          onBlur={() => {
            resetPosition();
            setCheckInput(false);
          }}
          onTouchMove={(e) => {
            e.target.blur();
            setCheckInput(false);
          }}
          style={{
            // borderRadius: "1rem",
            // boxDecorationBreak not supported on html2canvas
            // boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
            padding: ".5rem",
            // background: "crimson",
            outline: "none",
          }}
          contentEditable
        ></span>
      </div>
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
        onRotate={onRotate}
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
