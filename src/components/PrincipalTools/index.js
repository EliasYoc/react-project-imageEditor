import React, { useContext, useRef } from "react";
import { LayoutToolBox } from "../../utils/styledComponents";
import { IoCrop } from "react-icons/io5";
import { BiPalette } from "react-icons/bi";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { StyledButton } from "../ButtonTool/styles";
import HeaderChildren from "../DrawingTools/components/HeaderChildren";
const PrincipalTools = () => {
  const { openOptionPage, insertElementToHeader, refOpenDisplayProperty } =
    useContext(ContextConfiguration);
  const refToolBox = useRef();
  const handleAddClassListFade = () => {
    refToolBox.current.classList.add("closeDown");
  };
  console.log("principal box");

  return (
    <>
      <LayoutToolBox
        className="animationAppearUp"
        gap="1rem"
        display="flex"
        justifyContent="center"
        borderRadius="50px"
        margin="10px auto"
        bottom="0"
        ref={refToolBox}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") {
            console.log("transition", refOpenDisplayProperty.current);
            openOptionPage({ [refOpenDisplayProperty.current]: true });
          }
        }}
      >
        <StyledButton
          onClick={() => {
            insertElementToHeader(<HeaderChildren />);
            handleAddClassListFade();
            refOpenDisplayProperty.current = "isDrawingToolsOpen";
          }}
        >
          <BiPalette />
        </StyledButton>
        <StyledButton
          onClick={() => {
            handleAddClassListFade();
            refOpenDisplayProperty.current = "isCropToolsOpen";
          }}
        >
          <IoCrop />
        </StyledButton>
      </LayoutToolBox>
    </>
  );
};

export default PrincipalTools;
