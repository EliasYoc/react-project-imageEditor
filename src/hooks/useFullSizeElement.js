import { useEffect, useRef, useState } from "react";
// Devuelve el tamaño de un elemento si este contiene,
// Si el elemento contiene elementos con conditional render, esos condicinales deberan ir al array de dependencias para calcular cuando se muestren los elementos
const useFullSizeElement = (arrayDepenencies = []) => {
  const [elementSize, setElementSize] = useState(undefined);
  const refElement = useRef();
  console.log(refElement);
  useEffect(() => {
    if (refElement?.current) {
      console.log("current");
      const {
        margin,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        height,
        width,
      } = getComputedStyle(refElement.current);
      setElementSize({
        margin,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        height,
        width,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refElement, ...arrayDepenencies]);

  return { refElement, elementSize };
};

export default useFullSizeElement;
