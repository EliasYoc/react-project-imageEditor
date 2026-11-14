import styled from "styled-components";

export const OptionsList = styled.ul`
  position: ${({ position }) => position};
  min-width: 200px;
  left: ${({ left }) => left};
  right: ${({ right }) => right};
  top: ${({ top }) => top};
  bottom: ${({ bottom }) => bottom};
  inset: ${({ inset }) => inset};
  /* Antes: (background) => background recibía TODAS las props y generaba
     "background: [object Object]" (CSS inválido, el menú quedaba sin fondo). */
  background: ${({ background }) => background};
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  z-index: var(--z-menu);
`;

export const OptionLi = styled.li`
  list-style: none;
`;

export const OptionText = styled.span``;
