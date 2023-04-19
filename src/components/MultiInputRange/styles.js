import styled from "styled-components";

export const WrapperMultiRangeInput = styled.div`
  position: relative;
  height: 5px;
  background: gray;
  margin: 1rem 0;
  cursor: ${({ lineCursor }) => lineCursor};
`;

export const RangeStyled = styled.input`
  position: absolute;
  width: 100%;
  left: 0;
  top: 50%;
  user-select: none;
  outline: none;

  &,
  &::-webkit-slider-runnable-track,
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    user-select: none;
  }

  &::-webkit-slider-runnable-track {
    height: 0;
  }

  &::-webkit-slider-thumb {
    transform: translateY(-50%);
    cursor: ${({ thumbCursor }) => thumbCursor};
    width: ${({ width }) => width || "30px"};
    height: ${({ height }) => height || "30px"};
    border: ${({ border }) => border || "2px solid black"};
    border-radius: ${({ borderRadius }) => borderRadius || "30px"};
    background: ${({ thumbBackground }) => thumbBackground || "yellow"};
    transition: border 0.3s ease;
  }
  &:focus::-webkit-slider-thumb {
    border: 5px solid black;
  }
`;
