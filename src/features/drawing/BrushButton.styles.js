import styled from "styled-components";
import { GlobalButton } from "../../components/ui/legacy/styledComponents";

export const LabelTool = styled.label`
  position: relative;
  z-index: 1;
`;

// El pincel activo se resalta con CSS (:checked). Antes se medía la posición
// del botón con offsetLeft y se guardaba en un Context global.
export const InputTool = styled.input`
  display: none;
  &:checked ~ ${GlobalButton} {
    color: var(--color-text-active);
    background-color: var(--color-surface-active);
  }
`;
