import styled from "styled-components";
import { themeColor } from "../../context/ConfigurationProvider";
import { GlobalButton } from "../../utils/styledComponents";

export const LabelTool = styled.label`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || "transparent"};
  position: ${({ position }) => position || "relative"};
  z-index: 1;
`;

export const InputTool = styled.input`
  display: none;
  &:checked ~ ${GlobalButton} {
    color: ${themeColor.activeTextColor};
  }
`;
