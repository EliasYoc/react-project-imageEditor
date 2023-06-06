import { WrapperRange } from "./styles";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import "./RangeSlider.css";
import { useDispatch } from "react-redux";
import { setRangeValues } from "../../features/paintingSlice";
import { useEffect } from "react";
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
