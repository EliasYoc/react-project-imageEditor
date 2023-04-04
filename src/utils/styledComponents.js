import styled, { keyframes } from "styled-components";
import { themeColor } from "../context/ConfigurationProvider";

export const showUp = keyframes`
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(0);
    }
`;
export const fadeIn = keyframes`
  0%{
    opacity:0;
  }100{
    opacity:1;
  }
`;

export const LayoutToolBox = styled.div`
  display: ${({ display }) => display || "block"};
  gap: ${({ gap }) => gap || "0px"};
  align-items: ${({ alignItems }) => alignItems || "center"};
  justify-content: ${({ justifyContent }) => justifyContent || "center"};
  background-color: ${({ backgroundColor }) =>
    backgroundColor || themeColor.boxesColor};
  border-radius: ${({ borderRadius }) => borderRadius || "1rem"};
  width: ${({ width }) => width || "clamp(300px, 90% ,500px)"};
  height: ${({ height }) => height || "auto"};
  margin: ${({ margin }) => margin || "auto"};
  padding: ${({ padding }) => padding || "0"};
  position: ${({ position }) => position || "absolute"};
  top: ${({ top }) => top || "auto"};
  right: ${({ right }) => right || "0"};
  left: ${({ left }) => left || "0"};
  bottom: ${({ bottom }) => bottom || "auto"};
  flex-shrink: 0;
  transition: transform 0.3s ease;
  &.closeDown {
    transform: translateY(calc(100% + 10px));
  }
`;
export const FittedPaintWrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const GlobalButton = styled.span`
  width: ${({ width }) => width || "45px"};
  height: ${({ height }) => height || "45px"};
  background-image: ${({ backgroundImage }) => backgroundImage || "none"};
  background-size: ${({ backgroundSize }) => backgroundSize || "auto auto"};
  background-position: ${({ backgroundPosition }) =>
    backgroundPosition || "0% 0%"};

  background-color: ${({ backgroundColor }) =>
    backgroundColor || "transparent"};
  border: ${({ border }) => border || "none"};
  display: ${({ display }) => display || "flex"};
  align-items: ${({ alignItems }) => alignItems || "center"};
  justify-content: ${({ justifyContent }) => justifyContent || "center"};
  border-radius: ${({ borderRadius }) => borderRadius || "100px"};
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

export const FixedContainer = styled.div`
  position: fixed;
  background: #00000091;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  animation: ${fadeIn} 0.3s ease;

  &.close {
    transition: opacity 0.3s ease;
    opacity: 0;
  }
`;

export const PencilBackgroundColor = styled.span`
  width: 100%;
  height: 100%;
  transition: background 0.3s ease;
  background-color: ${({ backgroundColor }) =>
    backgroundColor || "transparent"};
`;

export const ProgressBar = styled.div`
  position: absolute;
  width: ${({ width }) => width};
  height: 5px;
  background: #2499c7;
  top: 100%;
  left: 0;
  transition: width 0.2s ease;
`;
