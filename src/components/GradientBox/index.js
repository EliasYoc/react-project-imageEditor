import React, { useContext } from "react";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import { reduceAspectRatioQualityOfIncomingImage } from "../../utils/helper";
import { GradientPreviewContainer } from "./styles";

const GradientBox = () => {
  const { canvasSize } = useContext(ContextConfiguration);

  const { newWidth, newHeight } = reduceAspectRatioQualityOfIncomingImage({
    options: canvasSize,
    expectedMaxPixelsSize: 300,
  });
  console.log(newWidth, newHeight);

  return (
    <>
      <GradientPreviewContainer>
        <canvas
          style={{
            background: "orange",
            width: `${newWidth}px`,
            height: `${newHeight}px`,
          }}
        >
          Not supported
        </canvas>
      </GradientPreviewContainer>
    </>
  );
};

export default GradientBox;
