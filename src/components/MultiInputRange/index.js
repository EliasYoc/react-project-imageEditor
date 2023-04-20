import React from "react";
import { RangeStyled, WrapperMultiRangeInput } from "./styles";

const MultiInputRange = ({
  onChange = () => {},
  onClickThumb = () => {},
  onClickLine = () => {},
  onMouseTouchStartThumb = () => {},
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
  style,
}) => {
  return (
    <WrapperMultiRangeInput
      style={style}
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
            onTouchStart={onMouseTouchStartThumb}
            onMouseDown={onMouseTouchStartThumb}
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
