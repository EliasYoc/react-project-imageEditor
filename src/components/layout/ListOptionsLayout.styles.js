import styled from "styled-components";

export const OptionsList = styled.ul`
  position: ${({ position }) => position};
  min-width: 200px;
  left: ${({ left }) => left};
  right: ${({ right }) => right};
  top: ${({ top }) => top};
  bottom: ${({ bottom }) => bottom};
  inset: ${({ inset }) => inset};
  background: ${(background) => background};
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  z-index: 100;
`;

export const OptionLi = styled.li`
  list-style: none;
`;

export const OptionText = styled.span``;
