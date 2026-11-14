import styled from "styled-components";

export const ConfirmBox = styled.div`
  padding: 1rem;
  border-radius: 1rem;
  background: #2e2e2ec9;
  min-width: 300px;
`;

export const ConfirmDescription = styled.div`
  user-select: none;
  margin-bottom: 1rem;
  font-size: 14px;
`;

export const ConfirmButton = styled.button`
  padding: 1rem 1.2rem;
  border-radius: 0.5rem;
  background: ${({ background }) => background};
  color: ${({ color }) => color};
  outline: ${({ outline }) => outline};

  border: ${({ border }) => border};
`;

export const ContainerButtons = styled.div`
  display: flex;
  justify-content: end;
  margin-top: 1rem;
  gap: 1rem;
`;
