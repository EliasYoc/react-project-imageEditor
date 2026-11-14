import RangeSliderModule from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import { WrapperRange } from "./PixelRange.styles";
import "./RangeSlider.css";

// El paquete declara "module" pero publica CommonJS, y con Vite la importación
// por defecto llega como `{ default: Componente }`. Webpack (CRA) lo resolvía
// solo. Este slider se sustituye en la Fase 6.
const RangeSlider = RangeSliderModule.default ?? RangeSliderModule;

/**
 * Slider vertical controlado para tamaños (pincel o texto).
 *
 * El slider vertical crece hacia abajo, así que el valor se invierte aquí
 * dentro: arriba = más grande. Antes esta conversión (y los límites min/max)
 * vivían en el estado global.
 */
const PixelRange = ({ value, min, max, onChange }) => {
  const toThumb = (size) => max + min - size;

  return (
    <WrapperRange>
      <RangeSlider
        onInput={([thumb]) => onChange(toThumb(thumb))}
        className="one-thumb-range"
        value={[toThumb(value), max]}
        thumbsDisabled={[false, true]}
        rangeSlideDisabled={true}
        min={min}
        max={max}
        orientation="vertical"
      />
    </WrapperRange>
  );
};

export default PixelRange;
