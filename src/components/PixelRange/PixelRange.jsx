import { WrapperRange } from "./styles";
import RangeSliderModule from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import "./RangeSlider.css";
import { useDispatch } from "react-redux";
import { setRangeValues } from "../../features/paintingSlice";
import { useEffect } from "react";

// El paquete declara "module" pero publica CommonJS, y con Vite la importación
// por defecto llega como `{ default: Componente }`. Webpack (CRA) lo resolvía
// solo. Este slider se sustituye en la Fase 6.
const RangeSlider = RangeSliderModule.default ?? RangeSliderModule;

const PixelRange = ({ pixelSize, minValue = 10, maxValue = 150, onInput }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setRangeValues({ minValue, maxValue }));
  }, [dispatch, minValue, maxValue]);

  return (
    <WrapperRange>
      <RangeSlider
        onInput={onInput}
        className="one-thumb-range"
        value={[pixelSize, maxValue]}
        thumbsDisabled={[false, true]}
        rangeSlideDisabled={true}
        min={minValue}
        max={maxValue}
        orientation="vertical"
      />
    </WrapperRange>
  );
};

export default PixelRange;
