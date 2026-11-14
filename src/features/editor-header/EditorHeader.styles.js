import styled from "styled-components";

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
