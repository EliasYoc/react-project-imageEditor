import styled from "styled-components";

export const FontBox = styled.div`
  width: 200px;
  max-height: 350px;
  border-radius: 0.5rem;
  background: #2e2e2ee0;
  position: absolute;
  bottom: 100%;
  left: 0;
  display: grid;
  margin-bottom: 1rem;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;

  &.open {
    grid-template-rows: 1fr;
  }
`;

export const FontInput = styled.input`
  display: none;
`;
export const FontLabel = styled.label`
  padding: 0.5rem;
  font-family: ${({ fontFamily }) => fontFamily};
  &:has(> ${FontInput}:checked) {
    background: #4d4c4c;
  }
`;

export const InputDownloadName = styled.input`
  display: block;
  width: 100%;
  background: #515151e0;
  border: none;
  padding: 1rem 1.2rem;
  border-radius: 0.5rem;
  color: #fff;

  &:focus {
    outline: 2px black solid;
  }
`;

export const WarningEmptyNameField = styled.span`
  font-size: 12px;
  color: #ff3b60;
`;
