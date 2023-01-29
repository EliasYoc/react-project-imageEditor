import styled from "styled-components";
import { themeColor } from "../../context/ConfigurationProvider";

export const LabelTool = styled.label`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || "transparent"};
  position: ${({ position }) => position || "relative"};
  z-index: 1;
`;

export const StyledButton = styled.span`
  width: ${({ width }) => width || "45px"};
  height: ${({ height }) => height || "45px"};
  background-color: ${({ backgroundColor }) =>
    backgroundColor || "transparent"};
  border: ${({ border }) => border || "none"};
  display: ${({ display }) => display || "flex"};
  align-items: ${({ alignItems }) => alignItems || "center"};
  justify-content: ${({ justifyContent }) => justifyContent || "center"};
  border-radius: ${({ borderRadius }) => borderRadius || "50%"};
  font-size: ${({ fontSize }) => fontSize || "1.5rem"};
  padding: ${({ padding }) => padding || ".5rem"};
  position: ${({ position }) => position || "relative"};
  top: ${({ top }) => top || "auto"};
  left: ${({ left }) => left || "auto"};
  overflow: ${({ overflow }) => overflow || "hidden"};
  margin: ${({ margin }) => margin || ".2rem 0"};
  z-index: ${({ zIndex }) => zIndex || "0"};
  flex-shrink: ${({ flexShrink }) => flexShrink || "1"};
  flex-grow: ${({ flexGrow }) => flexGrow || "0"};
  transition: left 0.4s cubic-bezier(0.42, -0.04, 0.56, 1.22);
  user-select: none;
  &:active {
    background: ${themeColor.activeBgColor};
    transition: background 0.4s ease;
  }
`;
export const InputTool = styled.input`
  display: none;
  &:checked ~ ${StyledButton} {
    color: ${themeColor.activeTextColor};
  }
`;
