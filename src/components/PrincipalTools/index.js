import React, { useContext, useRef } from "react";
import { GlobalButton, LayoutToolBox } from "../../utils/styledComponents";
import { IoCrop } from "react-icons/io5";
import { BiImageAlt, BiPalette } from "react-icons/bi";
import { ContextConfiguration } from "../../context/ConfigurationProvider";
import HeaderChildren from "../DrawingTools/components/HeaderChildren";
import { readFile } from "../../utils/helper";
const PrincipalTools = () => {
  const {
    openOptionPage,
    insertElementToHeader,
    refOpenDisplayProperty,
    setCanvasSize,
    setPrincipalImageLoaded,
    canvasSize,
    setIsLoadingImage,
    setLowQualityDataImageLoaded,
  } = useContext(ContextConfiguration);
  const refToolBox = useRef();
  const handleAddClassListFade = () => {
    refToolBox.current.classList.add("closeDown");
  };
  const handleLoadImage = async ({ target: $input }) => {
    setIsLoadingImage(true);
    try {
      const data = await readFile({ file: $input.files[0] });

      const $img = new Image();
      $img.src = data.result;
      $img.onload = () => {
        let width;
        let height;
        if ($img.width > canvasSize.width * 2) {
          width = Math.round($img.width / 2);
          height = Math.round($img.height / 2);
        } else {
          width = $img.width;
          height = $img.height;
        }
        setCanvasSize({ width, height });
        const { newHeight, newWidth } = reduceAspectRatioQualityOfIncomingImage(
          { imageElement: $img, expectedNewWidth: 1280 }
        );
        const $newHiddenCanvas = document.createElement("canvas");
        $newHiddenCanvas.width = newWidth;
        $newHiddenCanvas.height = newHeight;
        const newCtx = $newHiddenCanvas.getContext("2d");
        newCtx.drawImage($img, 0, 0, newWidth, newHeight);
        setLowQualityDataImageLoaded($newHiddenCanvas.toDataURL("image/jpeg"));
        setIsLoadingImage(false);
        setPrincipalImageLoaded($img);
      };
    } catch (error) {
      alert(JSON.stringify(error));
    }
  };
  const reduceAspectRatioQualityOfIncomingImage = ({
    imageElement,
    expectedNewWidth,
  }) => {
    let ratio;
    if (imageElement.height < imageElement.width) {
      ratio = imageElement.height / imageElement.width;
      const newHeight = expectedNewWidth * ratio;
      return { newWidth: expectedNewWidth, newHeight };
    } else {
      ratio = imageElement.width / imageElement.height;
      const newWidth = expectedNewWidth * ratio;
      return { newWidth, newHeight: expectedNewWidth };
    }
  };
  return (
    <>
      <LayoutToolBox
        className="animationAppearUp"
        gap="1rem"
        display="flex"
        justifyContent="center"
        borderRadius="50px"
        margin="10px auto"
        bottom="0"
        ref={refToolBox}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") {
            console.log("transition", refOpenDisplayProperty.current);
            openOptionPage({ [refOpenDisplayProperty.current]: true });
          }
        }}
      >
        <GlobalButton
          onClick={() => {
            insertElementToHeader(<HeaderChildren />);
            handleAddClassListFade();
            refOpenDisplayProperty.current = "isDrawingToolsOpen";
          }}
        >
          <BiPalette />
        </GlobalButton>
        <GlobalButton
          onClick={() => {
            handleAddClassListFade();
            refOpenDisplayProperty.current = "isCropToolsOpen";
          }}
        >
          <IoCrop />
        </GlobalButton>
        <label htmlFor="download-img">
          <input
            style={{ display: "none" }}
            type="file"
            id="download-img"
            accept="image/*"
            onChange={handleLoadImage}
          />
          <GlobalButton flexShrink="0">
            <BiImageAlt />
          </GlobalButton>
        </label>
      </LayoutToolBox>
    </>
  );
};

export default PrincipalTools;
