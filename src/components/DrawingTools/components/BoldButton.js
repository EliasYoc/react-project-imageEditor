import React, { useEffect, useState } from "react";
import { GlobalButton } from "../../../utils/styledComponents";
import { BiBold } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import {
  applyDraggableTextFontWeight,
  selectDraggableTextId,
} from "../../../features/paintingSlice";

const BoldButton = () => {
  const draggableTextId = useSelector(selectDraggableTextId);
  const dispatch = useDispatch();
  const [disableButton, setDisableButton] = useState(true);

  const draggableTextList = document.querySelectorAll(".draggableText");
  const hasDraggableTexts = draggableTextList.length > 0;

  useEffect(() => {
    if (draggableTextId) {
      const $draggableElementText = document.getElementById(draggableTextId);
      if (
        $draggableElementText.classList.contains("draggableText") &&
        hasDraggableTexts
      ) {
        setDisableButton(false);
      } else {
        setDisableButton(true);
      }
    }

    return () => {};
  }, [draggableTextId, hasDraggableTexts]);

  const handleChange = (e) => {
    const $draggableElementText = document.getElementById(draggableTextId);
    if (e.target.checked) {
      $draggableElementText.style.fontWeight = e.target.value;
      $draggableElementText.dataset.fontWeight = e.target.value;
      dispatch(applyDraggableTextFontWeight(e.target.value));
    } else {
      $draggableElementText.style.fontWeight = 500;
      $draggableElementText.dataset.fontWeight = 500;
      dispatch(applyDraggableTextFontWeight(500));
    }
  };
  return (
    <GlobalButton
      width="auto"
      height="auto"
      fontSize="1.5rem"
      overflow="visible"
      padding="0"
      color={`${!disableButton ? "auto" : "#4d4c4c"}`}
      style={{ pointerEvents: !disableButton ? "auto" : "none" }}
    >
      <input
        type="checkbox"
        name="font"
        id="bold"
        style={{ display: "none" }}
        onChange={handleChange}
        value={900}
      />
      <label
        htmlFor="bold"
        style={{ display: "flex", width: "100%", padding: ".5rem" }}
      >
        <BiBold />
      </label>
    </GlobalButton>
  );
};

export default BoldButton;
