import styled from "styled-components";

const Spinner = styled.span`
  width: 48px;
  height: 48px;
  border: 5px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
  position: relative;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

/** Indicador de carga a pantalla completa (anunciado a lectores de pantalla). */
const LoaderSpinner = () => <Spinner role="status" aria-label="Cargando" />;

export default LoaderSpinner;
