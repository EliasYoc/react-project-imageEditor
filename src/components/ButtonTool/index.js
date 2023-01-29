import React, { useContext, useEffect, useRef } from "react";
import { ContextToolBoxes } from "../../context/ToolBoxesProvider";
import { InputTool, LabelTool, StyledButton } from "./styles";

const ButtonTool = ({
  icon: Icon,
  htmlFor = "radio",
  children,
  name = "globalButton",
  active = false,
  width = "45px",
  height = "45px",
  fontSize,
  onClick = () => {},
}) => {
  const {
    toolBoxRadio,
    setRadioToolBoxes,
    handleChangeSelectToolButton,
    setActiveButtonPosition,
  } = useContext(ContextToolBoxes);
  const refToolLabel = useRef();
  const refToolButton = useRef();
  const selectedButton = toolBoxRadio[name];
  useEffect(() => {
    if (active && !selectedButton) {
      // console.log(selectedButton, "selected");
      // console.log(`useEffect ${htmlFor}`);
      // console.log(htmlFor, " isActive");
      setRadioToolBoxes((prevToolBoxRadio) => ({
        ...prevToolBoxRadio,
        [name]: htmlFor,
      }));
      setActiveButtonPosition({
        left: `${refToolLabel.current.offsetLeft}px`,
        top: `${refToolButton.current.offsetTop}px`,
        width: getComputedStyle(refToolButton.current).width,
        height: getComputedStyle(refToolButton.current).height,
      });
    }
  }, [
    active,
    htmlFor,
    name,
    setRadioToolBoxes,
    selectedButton,
    refToolButton,
    refToolLabel,
    setActiveButtonPosition,
  ]);
  return (
    <LabelTool onClick={(e) => onClick(e)} ref={refToolLabel} htmlFor={htmlFor}>
      <InputTool
        onChange={(e) => {
          handleChangeSelectToolButton(e, name);
          setActiveButtonPosition((prevActivePosition) => ({
            ...prevActivePosition,
            left: `${refToolLabel.current.offsetLeft}px`,
          }));
        }}
        type="radio"
        id={htmlFor}
        name={name}
        checked={selectedButton === htmlFor}
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
