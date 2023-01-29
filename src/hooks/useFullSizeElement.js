import { useEffect, useRef, useState } from "react";

const useFullSizeElement = () => {
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
    // con el fullSize como dependencia da loop infinito,
    // entonces desde el elemento padre la funcion que se pase a ese fullSize
    // debe estar en un callback
  }, [refElement]);

  return { refElement, elementSize };
};

export default useFullSizeElement;
