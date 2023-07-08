/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import { useDispatch, useSelector } from "react-redux";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
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
import { DraggableTextElement, SpanDraggableText } from "./styles";

/**
 *
 * @param {String} type draggableText | draggableImage
 * @returns a draggable component
 */
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
  fontWeight,
  type,
  draggableData,
  i,
}) => {
  const { isEditingText, refFrontalCanvas } = useContext(ContextConfiguration);
  const draggableTextId = useSelector(selectDraggableTextId);
  const draggableTextFontSize = useSelector(selectDraggableTextFontSize);
  const refEditableElement = useRef();
  const refMoveable = useRef();
  const dispatch = useDispatch();
  const [updateRectTimes, setUpdateRectTimes] = useState(0);
  const [zIndexDraggableElement, setZIndexDraggableElement] = useState(15 + i);

  useEffect(() => {
    setCheckInput(true);
    if (type === "draggableText") {
      refEditableElement.current.focus();
    }
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
      console.log("updating");
      saveUpdatedMoveableRect();
    },
    [fontFamily, fontWeight]
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
    function reapplyFontSize() {
      if (!draggableTextId) return;
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
    saveUpdatedMoveableRect();
    resetPosition();
  };

  const upateMoveableRectDebounce = debounce(() => {
    saveUpdatedMoveableRect();
  }, 100);

  useEffect(
    function getZIndexDraggable() {
      if (id === draggableTextId) {
        const draggableElements = Array.from(
          document.querySelectorAll(".draggable")
        );

        const zIndexElements = draggableElements.map((draggable) =>
          parseInt(getComputedStyle(draggable).zIndex)
        );

        const maxDraggable = Math.max(...zIndexElements);

        setZIndexDraggableElement(maxDraggable + 1);
      }
    },
    [draggableTextId]
  );

  return (
    <>
      <DraggableTextElement
        id={id}
        className={`target${id} draggable ${
          type === "draggableText" ? "draggableText" : ""
        }`}
        onClick={() => dispatch(applyDraggableTextId(id))}
        onTouchStart={() => dispatch(applyDraggableTextId(id))}
        zIndex={zIndexDraggableElement}
      >
        {type === "draggableText" && (
          <SpanDraggableText
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
            contentEditable
          ></SpanDraggableText>
        )}
        {type === "draggableImage" && (
          <img
            alt="elemento imagen"
            src={draggableData.imageUrl}
            style={{ width: "100%", borderRadius: ".5rem" }}
            onLoad={() => saveUpdatedMoveableRect()}
          />
        )}
      </DraggableTextElement>
      <Moveable
        ref={refMoveable}
        checkInput={checkInput}
        target={`.target${id}`}
        className={
          id === draggableTextId && isEditingText ? "editing" : "drawing"
        }
        scalable
        draggable
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
        snappable
        snapDirections={{
          top: true,
          center: true,
          middle: true,
          bottom: true,
          left: true,
          right: true,
        }}
        elementSnapDirections={{
          top: true,
          center: true,
          middle: true,
          bottom: true,
        }}
        snapThreshold={4}
        elementGuidelines={[refFrontalCanvas]}

        // onDrag={(e) => (e.target.style.transform = e.transform)}
        // bounds={{ top: 0, left: 0, right: 0, bottom: 0, position: "css" }}
      />
    </>
  );
};

export default ElementEditable;
