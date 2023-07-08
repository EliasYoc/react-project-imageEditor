import styled from "styled-components";
import { scaleShowUp } from "../../utils/styledComponents";

export const DraggableTextElement = styled.div`
  max-width: 315px;
  left: 50%;
  transform: translateX(-50%);
  top: 20px;
  position: absolute;
  color: rgba(0, 0, 0, 1);
  z-index: ${({ zIndex }) => zIndex || "15"};
  word-break: break-word;
  font-size: 1.4rem;
  font-weight: 500;
  // padding: 0.5rem 0;

  // applicar esta animacion afecta la descarga de una imagen con texto que ha sido rotado
  // animation: ${scaleShowUp} 0.3s ease;
`;

export const SpanDraggableText = styled.span`
  // borderRadius: "1rem",
  // boxDecorationBreak not supported on html2canvas
  // boxDecorationBreak: "clone",
  // background: "crimson",
  display: inline-block;
  -webkit-box-decoration-break: "clone";
  padding: 0.5rem;
  outline: none;
  text-shadow: rgb(0 0 0 / 30%) 0px 0px 2px;
`;
