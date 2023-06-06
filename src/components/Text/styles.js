import styled from "styled-components";
import { scaleShowUp } from "../../utils/styledComponents";

export const DraggableTextElement = styled.div`
  max-width: 315px;
  left: 50%;
  top: 20px;
  position: absolute;
  color: rgba(0, 0, 0, 1);
  z-index: ${({ zIndex }) => zIndex || "15"};
  word-break: break-word;
  font-size: 1.4rem;
  padding: 0.5rem 0;

  // applicar esta animacion afecta la descarga de una imagen con texto que ha sido rotado
  // animation: ${scaleShowUp} 0.3s ease;
`;
