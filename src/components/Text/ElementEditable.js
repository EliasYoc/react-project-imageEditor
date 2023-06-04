/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import { useDispatch, useSelector } from "react-redux";
import {
  applyDraggableTextId,
  selectDraggableTextFontSize,
  selectDraggableTextId,
} from "../../features/paintingSlice";
import {
  updateDraggableRect,
  updateInitialDraggableTextElementSize,
} from "../../utils/draggableElements";
import { debounce } from "../../utils/helper";
import { DraggableTextElement } from "./styles";

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
  fontFamily,
}) => {
  const draggableTextId = useSelector(selectDraggableTextId);
  const draggableTextFontSize = useSelector(selectDraggableTextFontSize);
  const refEditableElement = useRef();
  const refMoveable = useRef();
  const dispatch = useDispatch();
  const [updateRectTimes, setUpdateRectTimes] = useState(0);
  useEffect(() => {
    setCheckInput(true);
    refEditableElement.current.focus();
  }, [setCheckInput]);

  useEffect(
    function initialUpdateOfDraggableElement() {
      // puede que este forEach lo tenga que poner al descargar
      updateInitialDraggableTextElementSize(refGlobalDrawingLogs, id);
      dispatch(applyDraggableTextId(id));
      return () => {
        dispatch(applyDraggableTextId(null));
      };
    },
    [refGlobalDrawingLogs, dispatch]
  );

  useEffect(
    function refreshMoveable() {
      saveUpdatedMoveableRect();
    },
    [fontFamily]
  );

  useEffect(
    function setMoveableSize() {
      const moveable = refMoveable.current.getManager();
      if (moveable.state.target && updateRectTimes > 0) {
        const modifiedGlobalLogs = updateDraggableRect(
          refGlobalDrawingLogs,
          moveable,
          id
        );
        refGlobalDrawingLogs.current = modifiedGlobalLogs;
      }
    },
    [updateRectTimes]
  );

  useEffect(
    function applyFontSize() {
      if (!draggableTextId) return;
      console.log(draggableTextId);
      const $draggableText = document.getElementById(draggableTextId);
      $draggableText.style.fontSize = `${draggableTextFontSize}px`;
      $draggableText.dataset.fontSize = draggableTextFontSize;
      saveUpdatedMoveableRect();
    },
    [draggableTextFontSize]
  );
  // no cambia el refGlobalDrawingLogs (fixed)
  const saveUpdatedMoveableRect = async () => {
    refMoveable.current.updateRect();
    setUpdateRectTimes(updateRectTimes + 1);
  };

  const resetPosition = () => parentNode.scrollTo({ left: 0, top: 0 });

  const updateMoveableBlueArea = () => {
    // updateGlobalLogsElementSize();
    saveUpdatedMoveableRect();
    resetPosition();
  };

  const upateMoveableRectDebounce = debounce(() => {
    saveUpdatedMoveableRect();
  }, 100);

  // const updateGlobalLogsElementSize = debounce(() => {
  //   refGlobalDrawingLogs.current.forEach((log) => {
  //     if (log.whatTask === "draggableText" && log.id === id) {
  //       const draggableElement = document.getElementById(log.id);
  //       const { width, height } = getComputedStyle(draggableElement);
  //       const floatWidth = parseFloat(width.slice(0, -2));
  //       const floatHeight = parseFloat(height.slice(0, -2));
  //       log.realWidth = floatWidth;
  //       log.realHeight = floatHeight;
  //     }
  //   });
  // }, 300);

  return (
    <>
      <DraggableTextElement
        id={id}
        className={`target${id} draggableText`}
        onClick={() => dispatch(applyDraggableTextId(id))}
      >
        <span
          ref={refEditableElement}
          onKeyDown={updateMoveableBlueArea}
          onKeyUp={upateMoveableRectDebounce}
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
      </DraggableTextElement>
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
