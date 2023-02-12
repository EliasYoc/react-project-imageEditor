import styled from "styled-components";

export const SwipeableMenu = styled.section`
  width: 100%;
  background: #282828;
  border-radius: 1rem;
  color: #fff;
  & .react-colorful {
    width: 100%;
    padding: 0 1rem 1rem;
    height: auto;
    gap: 1rem;
  }
  & .react-colorful__hue,
  & .react-colorful__alpha {
    height: 2rem;
    border-radius: 0.5rem;
  }
  & .react-colorful__saturation {
    border-bottom: none;
    border-radius: 0.5rem;
    aspect-ratio: 1/1;
  }

  @media only screen and (min-width: 430px) {
    width: clamp(300px, 90%, 500px);
  }
`;
export const SwipeableMenuHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
`;
