import styled from "styled-components";

export const WrapperRange = styled.div`
  padding: 0 0.5rem;
  position: fixed;
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  transition: transform 0.3s ease;
  :hover {
    transform: translate(0, -50%);
  }
  z-index: 100;
`;
/* me fue imposible hacer un rango vertical, appearance: slider-vertical hace vertical solo la apariencia y el comportamiento en el celular funcionara bien
pero no se podrá dar estilos al ::-webkit-slider-thumb a menos que el input tenca appearance:none */
//remplazar por una libreria
