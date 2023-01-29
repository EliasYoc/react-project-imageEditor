import styled from "styled-components";
import { themeColor } from "../context/ConfigurationProvider";

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
`;
