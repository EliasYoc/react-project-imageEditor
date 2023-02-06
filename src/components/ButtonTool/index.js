import React, { useContext, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import {
  selectKindOfPencil,
  selectPencilType,
  selectRangeValues,
  setPencilSizeForRangeSlider,
  setPencilType,
} from "../../features/paintingSlice";
import { InputTool, LabelTool, StyledButton } from "./styles";

const ButtonTool = ({
  icon: Icon,
  htmlFor = "radio",
  children,
  name = "globalButton",
  width = "45px",
  height = "45px",
  fontSize,
  onClick = () => {},
}) => {
  const { setActiveButtonPosition } = useContext(ContextToolBoxes);
  const dispatch = useDispatch();
  const pencilType = useSelector(selectPencilType);
  const refToolLabel = useRef();
  const refToolButton = useRef();
  const kindOfPencilStyle = useSelector(selectKindOfPencil);
  const { minValue, maxValue } = useSelector(selectRangeValues);
  useEffect(() => {
    if (pencilType === htmlFor) {
      setActiveButtonPosition({
        left: `${refToolLabel.current.offsetLeft}px`,
        top: `${refToolButton.current.offsetTop}px`,
        width: getComputedStyle(refToolButton.current).width,
        height: getComputedStyle(refToolButton.current).height,
      });
    }
  }, [
    htmlFor,
    refToolButton,
    refToolLabel,
    setActiveButtonPosition,
    pencilType,
    kindOfPencilStyle,
    dispatch,
  ]);
  useEffect(() => {
    if (pencilType === htmlFor) {
      const pencilSizeForRange =
        maxValue + minValue - kindOfPencilStyle[pencilType].size;
      console.error("selected button");
      dispatch(setPencilSizeForRangeSlider(pencilSizeForRange));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlFor, pencilType, dispatch, maxValue, minValue]);

  return (
    <LabelTool onClick={(e) => onClick(e)} ref={refToolLabel} htmlFor={htmlFor}>
      <InputTool
        onChange={(e) => {
          dispatch(setPencilType(e.target.value));
        }}
        type="radio"
        id={htmlFor}
        name={name}
        checked={pencilType === htmlFor}
        value={htmlFor}
        title={htmlFor}
      />
      <StyledButton
        ref={refToolButton}
        fontSize={fontSize}
        width={width}
        height={height}
      >
        {Icon && <Icon />}
        {children}
      </StyledButton>
    </LabelTool>
  );
};

export default ButtonTool;
