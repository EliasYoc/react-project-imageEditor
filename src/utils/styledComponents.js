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

export const scaleShowUp = keyframes`
  0% {
      transform: scale(.8);
  }
    100% {
      transform: scale(1);
    }
`;
// clamp(300px, 90% ,500px)
export const LayoutToolBox = styled.div`
  display: ${({ display }) => display || "block"};
  gap: ${({ gap }) => gap || "0px"};
  align-items: ${({ alignItems }) => alignItems || "center"};
  justify-content: ${({ justifyContent }) => justifyContent || "center"};
  background-color: ${({ backgroundColor }) =>
    backgroundColor || themeColor.boxesColor};
  border-radius: ${({ borderRadius }) => borderRadius || "1rem"};
  width: ${({ width }) => width};
  height: ${({ height }) => height || "auto"};
  margin: ${({ margin }) => margin || "auto"};
  padding: ${({ padding }) => padding || "0"};
  position: ${({ position }) => position || "absolute"};
  top: ${({ top }) => top || "auto"};
  right: ${({ right }) => right || "0"};
  left: ${({ left }) => left || "0"};
  bottom: ${({ bottom }) => bottom || "auto"};
  font-size: ${({ fontSize }) => fontSize || "12px"};
  overflow: ${({ overflow }) => overflow || "visible"};
  flex-shrink: 0;
  transition: transform 0.3s ease, height 0.3s ease, width 0.3s ease;
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
  color: ${({ color }) => color};
  display: ${({ display }) => display || "flex"};
  gap: ${({ gap }) => gap || "0"};
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

  &:hover {
    background: none;
  }

  &:active {
    background: ${themeColor.activeBgColor};
    transition: background 0.4s ease;
  }
  @media only screen and (min-width: 600px) {
    &:hover {
      background: rgba(166, 166, 166, 0.1);
    }
  }
`;

// sin el pointer events y al abrir y cerrar rapidamente se colapsa el diseño y no volvera a abrir el modal
// uso pointer evente porque el componente usa transisionEnd, asi se evitará el evento click
export const FixedContainer = styled.div`
  position: fixed;
  background: #00000091;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex || "10"};
  animation: ${fadeIn} 0.3s ease;
  color: rgba(166, 166, 166, 0.75);
  &.close {
    transition: opacity 0.3s ease;
    opacity: 0;
    pointer-events: none;
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

export const GlobalSpinner = styled.span`
  width: ${({ width }) => width || "48px"};
  height: ${({ height }) => height || "48px"};
  border: ${({ border }) => border || "5px solid #fff"};

  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
