import styled from "styled-components";

export const GradientPreviewContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

export const WrapperGradientOptions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
`;

export const GradientContainer = styled.div`
  padding: 0 1rem 1rem;
`;

export const WrapperColorPicker = styled.div`
  & .react-colorful {
    width: auto;
    padding: 0;
  }
  & .react-colorful__alpha {
    display: none;
  }
`;

export const ApplyGradientButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  color: #fff;
  border: none;
  border-radius: 1rem;
  font-size: 1rem;
  transition: transform 0.1s ease;

  &:active {
    transform: scale(0.95);
  }

  /* ff 3.6+ */
  background: -moz-linear-gradient(
    90deg,
    rgba(131, 57, 233, 1) 1%,
    rgba(0, 173, 255, 1) 100%
  );

  /* safari 5.1+,chrome 10+ */
  background: -webkit-linear-gradient(
    90deg,
    rgba(131, 57, 233, 1) 1%,
    rgba(0, 173, 255, 1) 100%
  );

  /* opera 11.10+ */
  background: -o-linear-gradient(
    90deg,
    rgba(131, 57, 233, 1) 1%,
    rgba(0, 173, 255, 1) 100%
  );

  /* ie 6-9 */
  filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ADFF', endColorstr='#8339E9', GradientType=0 );

  /* ie 10+ */
  background: -ms-linear-gradient(
    90deg,
    rgba(131, 57, 233, 1) 1%,
    rgba(0, 173, 255, 1) 100%
  );

  /* global 94%+ browsers support */
  background: linear-gradient(
    90deg,
    rgba(131, 57, 233, 1) 1%,
    rgba(0, 173, 255, 1) 100%
  );
`;
