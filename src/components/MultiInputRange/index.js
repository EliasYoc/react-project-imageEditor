import React from "react";
import { RangeStyled, WrapperMultiRangeInput } from "./styles";

const MultiInputRange = ({
  onChange = () => {},
  onClickThumb = () => {},
  onClickLine = () => {},
  onTouchStartThumb = () => {},
  inputPropListObj = {},
  lineCursor,
  thumbCursor,
  thumbWidth,
  thumbHeight,
  thumbBorder,
  thumbBorderRadius,
  thumbBackground,
  min,
  max,
}) => {
  return (
    <WrapperMultiRangeInput
      lineCursor={lineCursor}
      onClick={() => {
        onClickLine();
      }}
    >
      {Object.values(inputPropListObj).map((inputProp, i) => {
        const { r, g, b, a } = inputProp.thumbBackground;
        return (
          <RangeStyled
            onClick={(e) => {
              e.stopPropagation();
              onClickThumb(inputProp.id);
            }}
            onTouchStart={onTouchStartThumb}
            thumbCursor={thumbCursor}
            onChange={onChange}
            type="range"
            name=""
            key={inputProp.id}
            id={inputProp.id}
            min={min}
            max={max}
            value={inputProp.thumbValue}
            width={thumbWidth}
            height={thumbHeight}
            border={thumbBorder || inputProp.thumbBorder}
            borderRadius={thumbBorderRadius}
            thumbBackground={thumbBackground || `rgba(${r}, ${g}, ${b}, ${a})`}
          />
        );
      })}
    </WrapperMultiRangeInput>
  );
};

export default MultiInputRange;
